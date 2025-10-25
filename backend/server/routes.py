# backend/server/routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Request
import os
from PIL import Image
import io
import base64

from . import services
from .config import MAX_TOP_N, BASE_DIR

# Strict upload size limit (5 MB)
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

router = APIRouter()


@router.get("/")
def root():
    return {"status": "ok", "message": "Are You Meme backend"}


@router.get("/health")
def health():
    """Get service health status."""
    status = services.get_service_status()
    return {"status": "ok", **status}


@router.post("/search")
async def search_image(
    request: Request,
    file: UploadFile = File(...),
    top_n: int = Query(5, ge=1, le=MAX_TOP_N),
):
    """Search for similar memes to the uploaded image using FAISS hybrid embedding backend."""
    print(
        f"[routes] Received search request filename={getattr(file,'filename',None)} top_n={top_n}"
    )

    # Check if FAISS is initialized
    if not services.faiss_index_initialized():
        raise HTTPException(status_code=500, detail="FAISS index not initialized")

    try:
        # Read uploaded image directly into memory
        contents = await file.read()

        # Enforce strict 5 MB limit (no compression)
        if len(contents) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large. Max 5 MB.")

        # Decode to PIL Image for model
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # now find similar images
        similar_images = services.find_similar_images(image, top_n)

        if not similar_images:
            raise HTTPException(status_code=404, detail="No similar images found")

        # Build image URLs - frontend will fetch with auth
        public_base = (os.getenv("PUBLIC_BASE_URL") or "").rstrip("/")

        def build_url(filename: str) -> str:
            return (
                f"{public_base}/memes/{filename}"
                if public_base
                else f"/memes/{filename}"
            )

        results = [
            {
                "image_url": build_url(img["filename"]),
                "score": img["score"],
                "filename": img["filename"],
            }
            for img in similar_images
        ]

        print(f"[routes] Returning {len(results)} results")
        return {
            "results": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[routes] Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Error processing image")
