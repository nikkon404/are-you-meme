# backend/server/services.py
import os
import json
from typing import List, Optional, Tuple

import numpy as np
import torch
from PIL import Image

from models.clip_encoder import load_clip_model, encode_image
from .config import EMBEDDINGS_FILE

# Globals exported by this module
MODEL = None
PREPROCESS = None
DEVICE = "cpu"
EMBEDDING_FILENAMES: List[str] = []
EMBEDDINGS_MATRIX: Optional[np.ndarray] = None  # shape (N, D)


def load_embeddings(path: str) -> Tuple[List[str], np.ndarray]:
    print(f"[services] Loading embeddings from: {path}")
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    with open(path, "r") as f:
        data = json.load(f)
    filenames = list(data.keys())
    if len(filenames) == 0:
        print("[services] No embeddings found in file.")
        return [], None
    mat = np.stack([np.array(data[f], dtype=np.float32) for f in filenames], axis=0)
    # normalize rows to unit vectors
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    mat = mat / norms
    print(f"[services] Loaded {len(filenames)} embeddings, dim={mat.shape[1]}")
    return filenames, mat


def init(device: str = None):
    """Initialize model and load embeddings. Call on startup."""
    global MODEL, PREPROCESS, DEVICE, EMBEDDING_FILENAMES, EMBEDDINGS_MATRIX
    DEVICE = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[services] Initializing services on device: {DEVICE}")
    if MODEL is not None:
        print("[services] Model already initialized, skipping.")
        return

    try:
        MODEL, PREPROCESS = load_clip_model(DEVICE)
        if MODEL is None or PREPROCESS is None:
            raise RuntimeError("CLIP model or preprocess is None after load")
        print("[services] CLIP model loaded successfully")
    except Exception as e:
        print(f"[services] Failed to load CLIP model: {str(e)}")
        MODEL, PREPROCESS = None, None
        raise RuntimeError(f"Failed to load CLIP model: {str(e)}")

    try:
        EMBEDDING_FILENAMES, EMBEDDINGS_MATRIX = load_embeddings(EMBEDDINGS_FILE)
        if not EMBEDDING_FILENAMES or EMBEDDINGS_MATRIX is None:
            raise RuntimeError("No embeddings loaded")
    except Exception as e:
        print(f"[services] Failed to load embeddings: {e}")
        EMBEDDING_FILENAMES, EMBEDDINGS_MATRIX = [], None
        raise RuntimeError(f"Failed to load embeddings: {str(e)}")


def compute_similarities(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Cosine similarities between query_vec (D,) and matrix (N,D)."""
    q = query_vec.astype(np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return np.zeros((matrix.shape[0],), dtype=np.float32)
    q = q / q_norm
    sims = matrix @ q
    return sims


def encode_image_tensor(image):
    """Preprocess & encode a PIL image -> normalized numpy vector.

    Uses the module-level MODEL, PREPROCESS and DEVICE which are set by init().
    """
    global MODEL, PREPROCESS, DEVICE
    if MODEL is None or PREPROCESS is None:
        raise RuntimeError("Model not initialized")
    img_t = PREPROCESS(image).unsqueeze(0).to(DEVICE)
    emb = encode_image(MODEL, img_t)
    emb_np = emb.detach().cpu().numpy().astype(np.float32)
    return emb_np
