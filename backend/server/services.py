# backend/server/services.py
import os
import json
from typing import Optional, Dict
from dataclasses import dataclass

import numpy as np
import torch
from PIL import Image

from models.clip_encoder import load_clip_model, encode_image
from .config import EMBEDDINGS_FILE


@dataclass
class CLIPService:
    model: any
    preprocess: any
    device: str
    embeddings: Optional[np.ndarray] = None
    embeddings_data: Optional[dict] = None

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess & encode a PIL image -> normalized numpy vector."""
        if self.model is None or self.preprocess is None:
            raise RuntimeError("Model not initialized")

        img_t = self.preprocess(image).unsqueeze(0).to(self.device)
        emb = encode_image(self.model, img_t)
        emb_np = emb.detach().cpu().numpy().astype(np.float32)
        return emb_np

    def find_similar_images(self, image: Image.Image, top_n: int = 1) -> list[dict]:
        """Find similar images and return their filenames and scores."""
        if self.embeddings is None or self.embeddings_data is None:
            raise RuntimeError("Service not fully initialized")

        # Encode query image
        query_emb = self.encode_image(image)

        # Compute similarities
        q = query_emb.astype(np.float32).reshape(-1)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return []
        q = q / q_norm
        sims = self.embeddings @ q

        # Get top matches
        top_idx = np.argsort(-sims)[:top_n]

        # Get filenames from original data
        filenames = list(self.embeddings_data.keys())
        return [
            {"filename": filenames[int(i)], "score": float(sims[int(i)])}
            for i in top_idx
        ]

    def is_initialized(self) -> bool:
        """Check if service is fully initialized."""
        return (
            self.model is not None
            and self.embeddings is not None
            and self.embeddings_data is not None
        )


# Global service instance
clip_service: Optional[CLIPService] = None


def load_embeddings(path: str) -> tuple[dict, np.ndarray]:
    """Load embeddings from JSON file."""
    print(f"[services] Loading embeddings from: {path}")
    if not os.path.exists(path):
        raise FileNotFoundError(path)

    with open(path, "r") as f:
        data = json.load(f)

    if not data:
        raise RuntimeError("No embeddings found in file")

    # Stack embeddings in order of JSON keys
    filenames = list(data.keys())
    mat = np.stack([np.array(data[f], dtype=np.float32) for f in filenames], axis=0)

    # Normalize rows to unit vectors
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    mat = mat / norms

    print(f"[services] Loaded {len(data)} embeddings, dim={mat.shape[1]}")
    return data, mat


def init(device: str = None) -> None:
    """Initialize CLIP service and load embeddings."""
    global clip_service

    if clip_service is not None:
        print("[services] Service already initialized, skipping.")
        return

    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[services] Initializing services on device: {device}")

    try:
        model, preprocess = load_clip_model(device)
        if model is None or preprocess is None:
            raise RuntimeError("CLIP model or preprocess is None after load")
        print("[services] CLIP model loaded successfully")
    except Exception as e:
        print(f"[services] Failed to load CLIP model: {str(e)}")
        raise RuntimeError(f"Failed to load CLIP model: {str(e)}")

    try:
        data, embeddings = load_embeddings(EMBEDDINGS_FILE)
    except Exception as e:
        print(f"[services] Failed to load embeddings: {e}")
        raise RuntimeError(f"Failed to load embeddings: {str(e)}")

    clip_service = CLIPService(
        model=model,
        preprocess=preprocess,
        device=device,
        embeddings=embeddings,
        embeddings_data=data,
    )


# Public API
def find_similar_images(image: Image.Image, top_n: int = 1) -> list[dict]:
    """Find similar images to the input image.

    Returns:
        List of dicts with 'filename' and 'score' keys.
    """
    if clip_service is None:
        raise RuntimeError("Service not initialized")
    return clip_service.find_similar_images(image, top_n)


def get_service_status() -> dict:
    """Get current status of the service."""
    status = {"initialized": False, "device": "cpu", "embeddings_count": 0}

    if clip_service:
        status.update(
            {
                "initialized": clip_service.is_initialized(),
                "device": clip_service.device,
                "embeddings_count": len(clip_service.embeddings_data or {}),
            }
        )

    return status


# For backward compatibility only
def get_device() -> str:
    return clip_service.device if clip_service else "cpu"


DEVICE = property(get_device)
MODEL = property(lambda: clip_service.model if clip_service else None)
