# backend/server/routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Request
import os
from PIL import Image
import io

from . import services
from .config import MAX_TOP_N

router = APIRouter()


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
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # now find similar images
        similar_images = services.find_similar_images(image, top_n)

        if not similar_images:
            raise HTTPException(status_code=404, detail="No similar images found")

        # Build image URLs using PUBLIC_BASE_URL when provided (prod), otherwise relative (dev/tunnel)
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
            }
            for img in similar_images
        ]

        print(f"[routes] Returning results")
        return {
            "best_match": results[0]["image_url"],
            "all_results": results,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[routes] Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Error processing image")
