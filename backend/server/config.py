# backend/server/config.py
import os

# Base dir is the backend folder (one level up from this file's directory)
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

EMBEDDINGS_FILE = os.path.join(BASE_DIR, "resources", "embeddings", "embeddings.json")
# Optional: add other config values here, e.g., MAX_TOP_N
MAX_TOP_N = 50
