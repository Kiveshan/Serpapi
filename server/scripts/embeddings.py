import json
import sys
from pathlib import Path
import torch
import pandas as pd
import psycopg2  # or import psycopg if using psycopg3
from psycopg2.extras import execute_values  # for efficient batch inserts
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_MODEL_DIR = Path("/var/app/current/model_cache")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# DB connection details - UPDATE THESE with your actual credentials
DB_CONFIG = {
    "dbname": "serpapi-app",      # your database name
    "user": "postgres",       # replace
    "password": "123456",  # replace
    "host": "localhost",          # or your DB host
    "port": "5432"
}

EXCEL_FILE = Path("../../consolidated_publications_no_duplicates2.xlsx")  # adjust path if needed
COLUMN_NAME = "JOURNAL TITLE                                      (Previous title if applicable)"

def _load_model():
    if LOCAL_MODEL_DIR.exists():
        try:
            return SentenceTransformer(str(LOCAL_MODEL_DIR), device=DEVICE)
        except Exception:
            pass
    return SentenceTransformer(MODEL_NAME, device=DEVICE)

model = _load_model()
model.max_seq_length = 256

def sentenceembedding(text):
    """Generate embedding for a single text or list of texts."""
    if isinstance(text, list):
        texts = text
    else:
        texts = [text]
    
    if DEVICE == "cuda":
        with torch.autocast(device_type="cuda", dtype=torch.float16):
            embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)
    else:
        embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)
    
    return embeddings

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def embed_and_store_dhet_titles():
    """Main function: read Excel, generate embeddings, store in DB."""
    if not EXCEL_FILE.exists():
        print(json.dumps({"error": f"Excel file not found: {EXCEL_FILE}"}))
        return

    print("Loading Excel file...")
    df = pd.read_excel(EXCEL_FILE, engine="openpyxl")
    
    if COLUMN_NAME not in df.columns:
        print(json.dumps({"error": f"Column '{COLUMN_NAME}' not found in Excel. Available columns: {list(df.columns)}"}))
        return

    # Clean and get unique titles (strip whitespace, drop NaN/empty)
    titles = df[COLUMN_NAME].astype(str).str.strip()
    titles = titles[titles.notna() & (titles != "nan") & (titles != "")]
    unique_titles = titles.drop_duplicates().tolist()

    print(f"Found {len(unique_titles)} unique journal titles to embed.")

    if not unique_titles:
        print(json.dumps({"error": "No valid titles found in the column."}))
        return

    # Generate embeddings in batch (more efficient)
    print("Generating embeddings...")
    embeddings = sentenceembedding(unique_titles)  # returns numpy array

    # Prepare data for batch insert: (title, embedding_list)
    data = [(title, emb.tolist()) for title, emb in zip(unique_titles, embeddings)]

    # Insert into DB
    conn = get_db_connection()
    try:
        
        with conn.cursor() as cur:
            # Use execute_values for fast batch insert
            # ON CONFLICT DO NOTHING prevents duplicates based on UNIQUE(title)
            query = """
                INSERT INTO "dhet_embedding" (title, title_embeded)
                VALUES %s
                ON CONFLICT (title) DO NOTHING;
            """
            execute_values(cur, query, data)
        
        conn.commit()
        print(f"Successfully inserted/updated {len(data)} embeddings into dhet_embedding table.")
    
    except Exception as e:
        conn.rollback()
        print(json.dumps({"error": f"Database error: {str(e)}"}))
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    # Support both CLI (for one-time run) and potential JSON input if needed
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        # Optional: keep backward compatibility with JSON input if you want
        inputdata = sys.stdin.read()
        data = json.loads(inputdata)
        # For now we ignore JSON and always run the full process
        embed_and_store_dhet_titles()
    else:
        embed_and_store_dhet_titles()