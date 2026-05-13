import json
import sys
from pathlib import Path
import torch
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_MODEL_DIR = Path("/var/app/current/model_cache")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

DB_CONFIG = {
    "dbname": "Serpapi",
    "user": "postgres",
    "password": "123456",
    "host": "localhost",
    "port": "5433"
}

EXCEL_FILE = Path("../../consolidated_publications_no_duplicates2.xlsx")
TITLE_COLUMN = "JOURNAL TITLE                                      (Previous title if applicable)"
AUTHOR_COLUMN = "EDITOR'S DETAILS                                                    (when available)"

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

def extract_author(author_text):
    """Extract author name from EDITOR'S DETAILS column (before first comma)."""
    if not author_text or pd.isna(author_text) or str(author_text).strip() == "nan":
        return None
    author_str = str(author_text).strip()
    # Extract part before first comma
    if "," in author_str:
        return author_str.split(",")[0].strip()
    return author_str

def embed_and_store_dhet_titles():
    """Main function: read Excel, generate embeddings, store in DB with author and venue."""
    if not EXCEL_FILE.exists():
        print(json.dumps({"error": f"Excel file not found: {EXCEL_FILE}"}))
        return

    print("Loading Excel file...")
    df = pd.read_excel(EXCEL_FILE, engine="openpyxl")
    
    if TITLE_COLUMN not in df.columns:
        print(json.dumps({"error": f"Column '{TITLE_COLUMN}' not found in Excel. Available columns: {list(df.columns)}"}))
        return

    # Extract authors if column exists
    has_author_column = AUTHOR_COLUMN in df.columns
    if has_author_column:
        print(f"Found author column: {AUTHOR_COLUMN}")
        df["author"] = df[AUTHOR_COLUMN].apply(extract_author)
    else:
        print(f"Author column '{AUTHOR_COLUMN}' not found, will use None for authors")
        df["author"] = None

    # Clean titles and authors
    df[TITLE_COLUMN] = df[TITLE_COLUMN].astype(str).str.strip()
    df = df[df[TITLE_COLUMN].notna() & (df[TITLE_COLUMN] != "nan") & (df[TITLE_COLUMN] != "")]

    # Create combined text for embedding: title + " " + author
    df["combined_text"] = df.apply(
        lambda row: f"{row[TITLE_COLUMN]} {row['author']}" if row['author'] else row[TITLE_COLUMN],
        axis=1
    )

    # Get unique combined texts
    unique_data = df[[TITLE_COLUMN, "author", "combined_text"]].drop_duplicates(subset=[TITLE_COLUMN])
    unique_combined_texts = unique_data["combined_text"].tolist()

    print(f"Found {len(unique_combined_texts)} unique journal titles to embed.")

    if not unique_combined_texts:
        print(json.dumps({"error": "No valid titles found in the column."}))
        return

    # Generate embeddings in batch (more efficient)
    print("Generating embeddings for title + author...")
    embeddings = sentenceembedding(unique_combined_texts)  # returns numpy array

    # Prepare data for batch insert into dhet_embedding
    embedding_data = []
    for _, row in unique_data.iterrows():
        idx = unique_data.index.get_loc(_)
        embedding_data.append((
            row[TITLE_COLUMN],
            row["author"],
            embeddings[idx].tolist()
        ))

    # Insert into DB
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Clear existing data to avoid conflicts
            cur.execute("DELETE FROM dhet_embedding")

            # Insert into dhet_embedding with author
            embedding_query = """
                INSERT INTO dhet_embedding (title, author, title_embeded)
                VALUES %s;
            """
            execute_values(cur, embedding_query, embedding_data)

        conn.commit()
        print(f"Successfully inserted {len(embedding_data)} embeddings into dhet_embedding table.")

    except Exception as e:
        conn.rollback()
        print(json.dumps({"error": f"Database error: {str(e)}"}))
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    # Support both CLI (for one-time run) and potential JSON input if needed
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        inputdata = sys.stdin.read()
        data = json.loads(inputdata)
        embed_and_store_dhet_titles()
    else:
        embed_and_store_dhet_titles()