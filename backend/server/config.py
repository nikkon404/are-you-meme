# backend/server/config.py
import os

# Base dir is the backend folder (one level up from this file's directory)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

EMBEDDINGS_DIR = os.path.join(BASE_DIR, "resources", "embeddings")
FAISS_INDEX_FILE = os.path.join(EMBEDDINGS_DIR, "hybrid.index")
FAISS_METADATA_FILE = os.path.join(EMBEDDINGS_DIR, "metadata.json")
EMBEDDINGS_FILE = os.path.join(EMBEDDINGS_DIR, "embeddings.json")  # fallback only
MAX_TOP_N = 10
