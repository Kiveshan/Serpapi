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
    "authors": [],
    "venues": [],
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
                SELECT title, title_embeded, author
                FROM public.dhet_embedding
                ORDER BY embed_id;
                """
            )
            rows = cur.fetchall()

        titles = [r[0] for r in rows]
        emb_np = np.array([r[1] for r in rows], dtype=np.float32)
        emb_t = torch.from_numpy(emb_np).to(DEVICE)
        authors = [r[2] if r[2] else "" for r in rows]
        # For DHET embedding, venue is the same as title (journal titles)
        venues = [r[0] if r[0] else "" for r in rows]

        DHET_CACHE["titles"] = titles
        DHET_CACHE["embeddings"] = emb_t
        DHET_CACHE["authors"] = authors
        DHET_CACHE["venues"] = venues
        DHET_CACHE["loaded"] = True
        return DHET_CACHE
    finally:
        conn.close()

def check_venue_match(search_venue, dhet_venues, dhet_titles):
    """Check if search venue matches any DHET venue or title (case-insensitive substring)."""
    if not search_venue:
        return 0.0, None
    
    search_venue_lower = str(search_venue).lower().strip()
    if not search_venue_lower:
        return 0.0, None
    
    for i, dhet_venue in enumerate(dhet_venues):
        dhet_venue_lower = str(dhet_venue).lower().strip() if dhet_venue else ""
        dhet_title_lower = str(dhet_titles[i]).lower().strip() if dhet_titles[i] else ""
        
        # Check if search venue is a substring of DHET venue
        if dhet_venue_lower and search_venue_lower in dhet_venue_lower:
            return 1.0, dhet_venue
        
        # Check if search venue is a substring of DHET title
        if dhet_title_lower and search_venue_lower in dhet_title_lower:
            return 1.0, dhet_titles[i]
        
        # Check if DHET venue is a substring of search venue
        if dhet_venue_lower and dhet_venue_lower in search_venue_lower:
            return 1.0, dhet_venue
        
        # Check if DHET title is a substring of search venue
        if dhet_title_lower and dhet_title_lower in search_venue_lower:
            return 1.0, dhet_titles[i]
    
    return 0.0, None

def extract_surname(author_name):
    """Extract surname from author name, handling various formats."""
    if not author_name:
        return ""
    
    name = str(author_name).strip().lower()
    
    # Remove titles like Prof, Dr, Mr, Mrs, Ms
    name = name.replace('prof.', '').replace('prof ', '').replace('dr.', '').replace('dr ', '')
    name = name.replace('mr.', '').replace('mr ', '').replace('mrs.', '').replace('mrs ', '')
    name = name.replace('ms.', '').replace('ms ', '')
    
    # Split into parts and take the last part as surname
    parts = name.split()
    if len(parts) == 0:
        return ""
    elif len(parts) == 1:
        return parts[0]
    else:
        # For multi-part names, the last part is usually the surname
        surname = parts[-1]
        # Handle cases like "van der Walt" - take last 2 parts if surname is very short
        if len(surname) <= 2 and len(parts) >= 2:
            surname = parts[-2] + " " + surname
        return surname

def check_author_match(search_authors, dhet_authors):
    """Check if search authors match DHET authors using improved fuzzy matching."""
    if not search_authors:
        return 0.0, None
    
    search_authors_str = str(search_authors).strip().lower()
    if not search_authors_str:
        return 0.0, None
    
    # Split search authors by common separators
    search_author_list = [a.strip() for a in search_authors_str.replace(';', ',').split(',') if a.strip()]
    
    for i, dhet_author in enumerate(dhet_authors):
        if not dhet_author:
            continue
        
        dhet_author_lower = str(dhet_author).strip().lower()
        dhet_author_list = [a.strip() for a in dhet_author_lower.replace(';', ',').split(',') if a.strip()]
        
        # Calculate matching percentage using improved matching
        matches = 0
        for search_author in search_author_list:
            for dhet_auth in dhet_author_list:
                # Extract surnames for comparison
                search_surname = extract_surname(search_author)
                dhet_surname = extract_surname(dhet_auth)
                
                # Check for exact surname match (highest priority)
                if search_surname and dhet_surname and search_surname == dhet_surname:
                    matches += 1
                    break
                # Check for substring match (fallback)
                elif search_author in dhet_auth or dhet_auth in search_author:
                    matches += 1
                    break
        
        # Calculate similarity as percentage of search authors that matched
        if len(search_author_list) > 0:
            similarity = matches / len(search_author_list)
            # More flexible matching: if we have at least one strong surname match, 
            # lower the threshold to 50% for partial matches
            has_surname_match = any(
                extract_surname(sa) == extract_surname(da) 
                for sa in search_author_list 
                for da in dhet_author_list
            )
            threshold = 0.5 if has_surname_match else 0.85
            if similarity >= threshold:
                return similarity, dhet_author
    
    return 0.0, None

def check_dhet_approval(search_texts, venues=None, authors=None, similarity_threshold: float = 0.85):
    cache = load_dhet_cache()
    if not cache["loaded"] or cache["embeddings"] is None or not cache["titles"]:
        return {"error": "DHET embeddings cache is empty"}

    if isinstance(search_texts, str):
        search_texts = [search_texts]

    search_texts = [str(t).strip() for t in search_texts if str(t).strip()]
    if not search_texts:
        return {"error": "No valid search texts"}

    # Handle venues and authors
    if venues is None:
        venues = [None] * len(search_texts)
    elif isinstance(venues, str):
        venues = [venues] * len(search_texts)
    
    if authors is None:
        authors = [None] * len(search_texts)
    elif isinstance(authors, str):
        authors = [authors] * len(search_texts)

    search_emb_np = sentence_embedding(search_texts)
    if len(search_emb_np) == 0:
        return {"error": "Failed to generate embeddings for search texts"}
    
    search_emb = torch.from_numpy(np.array(search_emb_np, dtype=np.float32)).to(DEVICE)

    sim = util.cos_sim(search_emb, cache["embeddings"])

    results = []
    for i, text in enumerate(search_texts):
        row = sim[i]
        best_idx = int(torch.argmax(row).item())
        title_similarity = float(row[best_idx].item())
        
        # Check venue match
        venue_similarity, venue_match = check_venue_match(
            venues[i] if i < len(venues) else None,
            cache["venues"],
            cache["titles"]
        )
        
        # Check author match
        author_similarity, author_match = check_author_match(
            authors[i] if i < len(authors) else None,
            cache["authors"]
        )
        
        # All three checks need to pass the threshold
        title_passed = title_similarity >= similarity_threshold
        venue_passed = venue_similarity >= 0.85
        author_passed = author_similarity >= 0.85
        
        approved = title_passed and venue_passed and author_passed
        
        results.append(
            {
                "search_text": text,
                "title_similarity": title_similarity,
                "venue_similarity": venue_similarity,
                "author_similarity": author_similarity,
                "best_match": cache["titles"][best_idx],
                "venue_match": venue_match,
                "author_match": author_match,
                "approved": approved,
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
        # Use title_similarity for the similarity field
        similarity = r.get("title_similarity", 0.0)
        data.append(
            (
                r["search_text"],
                search_emb_np[i].tolist(),
                float(similarity),
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


def process_search_results(search_texts, similarity_threshold: float = 0.85, venues=None, authors=None):
    checked = check_dhet_approval(search_texts, venues, authors, similarity_threshold)
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
        venues = payload.get("venues")
        authors = payload.get("authors")
        similarity_threshold = float(payload.get("similarity_threshold", 0.85))
        return process_search_results(search_texts, similarity_threshold, venues, authors)

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
