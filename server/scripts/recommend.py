import argparse
import json
import sys
from pathlib import Path

import numpy as np
import psycopg2
from psycopg2.extras import execute_values
import torch
from sentence_transformers import SentenceTransformer, util

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_MODEL_DIR = PROJECT_ROOT / "pythonModel" / "all-MiniLM-L6-v2"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
model = SentenceTransformer(str(LOCAL_MODEL_DIR) if LOCAL_MODEL_DIR.exists() else MODEL_NAME, device=DEVICE)
model.max_seq_length = 256

DB_CONFIG = {
    "dbname": "serpapi-app",
    "user": "postgres",
    "password": "123456",
    "host": "localhost",
    "port": "5432",
}

DHET_CACHE = {
    "loaded": False,
    "titles": [],
    "embeddings": None,
}


def _json_write(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def sentence_embedding(texts):
    if isinstance(texts, str):
        texts = [texts]
    if not isinstance(texts, list):
        texts = list(texts)
    
    # Filter out empty/None texts and ensure strings
    valid_texts = []
    for text in texts:
        if text is not None and text != "":
            if not isinstance(text, str):
                text = str(text)
            valid_texts.append(text.strip())
    
    if not valid_texts:
        # Return empty numpy array if no valid texts
        return np.array([])
    
    if DEVICE == "cuda":
        with torch.autocast(device_type="cuda", dtype=torch.float16):
            embeddings = model.encode(valid_texts, show_progress_bar=False, batch_size=32)
    else:
        embeddings = model.encode(valid_texts, show_progress_bar=False, batch_size=32)

    return embeddings


def load_dhet_cache(force: bool = False):
    if DHET_CACHE["loaded"] and not force:
        return DHET_CACHE

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT title, title_embeded
                FROM public.dhet_embedding
                ORDER BY embed_id;
                """
            )
            rows = cur.fetchall()

        titles = [r[0] for r in rows]
        emb_np = np.array([r[1] for r in rows], dtype=np.float32)
        emb_t = torch.tensor(emb_np, dtype=torch.float32, device=DEVICE)

        DHET_CACHE["titles"] = titles
        DHET_CACHE["embeddings"] = emb_t
        DHET_CACHE["loaded"] = True
        return DHET_CACHE
    finally:
        conn.close()

def check_dhet_approval(search_texts, similarity_threshold: float = 0.9):
    cache = load_dhet_cache()
    if not cache["loaded"] or cache["embeddings"] is None or not cache["titles"]:
        return {"error": "DHET embeddings cache is empty"}

    if isinstance(search_texts, str):
        search_texts = [search_texts]

    search_texts = [str(t).strip() for t in search_texts if str(t).strip()]
    if not search_texts:
        return {"error": "No valid search texts"}

    search_emb_np = sentence_embedding(search_texts)
    if len(search_emb_np) == 0:
        return {"error": "Failed to generate embeddings for search texts"}
    
    search_emb = torch.tensor(np.array(search_emb_np, dtype=np.float32), dtype=torch.float32, device=DEVICE)

    sim = util.cos_sim(search_emb, cache["embeddings"])

    results = []
    for i, text in enumerate(search_texts):
        row = sim[i]
        best_idx = int(torch.argmax(row).item())
        best_score = float(row[best_idx].item())
        results.append(
            {
                "search_text": text,
                "similarity": best_score,
                "best_match": cache["titles"][best_idx],
                "approved": best_score >= similarity_threshold,
            }
        )

    return {"results": results}


def store_approval_results(results: list[dict]):
    if not results:
        return 0

    search_texts = [r["search_text"] for r in results]
    search_emb_np = sentence_embedding(search_texts)
    
    if len(search_emb_np) == 0:
        return 0

    data = []
    for i, r in enumerate(results):
        data.append(
            (
                r["search_text"],
                search_emb_np[i].tolist(),
                float(r["similarity"]),
                bool(r["approved"]),
            )
        )

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM public.dhet_approved
                WHERE search_text = ANY(%s);
                """,
                (search_texts,),
            )
            query = """
                INSERT INTO public.dhet_approved (search_text, search_embeded, similarity, status)
                VALUES %s;
            """
            execute_values(cur, query, data)
        conn.commit()
        return len(data)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def process_search_results(search_texts, similarity_threshold: float = 0.9):
    checked = check_dhet_approval(search_texts, similarity_threshold)
    if "error" in checked:
        return checked

    results = checked["results"]
    inserted = store_approval_results(results)

    approved_count = sum(1 for r in results if r["approved"])
    return {
        "total_processed": len(results),
        "approved_count": approved_count,
        "rejected_count": len(results) - approved_count,
        "inserted": inserted,
        "results": results,
    }


def handle_request(payload: dict):
    action = payload.get("action")

    if action == "load_cache":
        cache = load_dhet_cache(force=True)
        return {"status": "cache_loaded", "titles_count": len(cache["titles"])}

    if action == "check_dhet_approval":
        search_texts = payload.get("search_texts") or []
        similarity_threshold = float(payload.get("similarity_threshold", 0.9))
        return process_search_results(search_texts, similarity_threshold)

    return {"error": "Unknown action"}


def serve_forever(preload_cache: bool = True):
    if preload_cache:
        try:
            load_dhet_cache(force=True)
        except Exception as e:
            _json_write({"error": f"Failed to preload cache: {e}"})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            payload = json.loads(line)
        except Exception:
            _json_write({"error": "Invalid JSON"})
            continue

        try:
            resp = handle_request(payload)
        except Exception as e:
            resp = {"error": str(e)}

        _json_write(resp)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    args = parser.parse_args()

    if args.serve:
        serve_forever(preload_cache=True)
        return

    inputdata = sys.stdin.read().strip()
    if not inputdata:
        _json_write({"error": "No input provided"})
        return

    try:
        payload = json.loads(inputdata)
    except Exception:
        _json_write({"error": "Invalid JSON"})
        return

    try:
        resp = handle_request(payload)
    except Exception as e:
        resp = {"error": str(e)}

    _json_write(resp)


if __name__ == "__main__":
    main()
