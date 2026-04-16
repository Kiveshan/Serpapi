import json, sys
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
import torch

PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOCAL_MODEL_DIR = PROJECT_ROOT / "pythonModel" / "all-MiniLM-L6-v2" 
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = SentenceTransformer(str(LOCAL_MODEL_DIR) if LOCAL_MODEL_DIR.exists() else "sentence-transformers/all-MiniLM-L6-v2", device=DEVICE)
model.max_seq_length = 256
def sentenceembedding(text):
    if DEVICE == "cuda":
        with torch.autocast(device_type="cuda", dtype=torch.float16):
            return model.encode(text, show_progress_bar=False)
    return model.encode(text, show_progress_bar=False)

if __name__ == "__main__":
    inputdata = sys.stdin.read()
    data = json.loads(inputdata)
    action = data.get('action')
    if action == "recommend":
        concept=data.get('concept', [])
        if concept:
            nr=data.get('nr', 5)
            supervisor=data.get('supdata', [])
            econcept=sentenceembedding(concept)
            result=recommsupervisors(supervisor, econcept, nr)
        else:
            result = {"error": "Concept note empty"}
        print(json.dumps(result))
