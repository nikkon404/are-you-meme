# backend/server/routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Request
from io import BytesIO
from PIL import Image
import numpy as np
import os
import uuid

from . import services
from .config import MAX_TOP_N

router = APIRouter()


@router.get("/health")
def health():
    count = (
        len(services.EMBEDDING_FILENAMES)
        if services.EMBEDDING_FILENAMES is not None
        else 0
    )
    model_status = "initialized" if services.MODEL is not None else "not initialized"
    return {
        "status": "ok",
        "model_status": model_status,
        "embeddings_count": count,
        "device": services.DEVICE,
    }


@router.post("/search")
async def search_image(
    request: Request,
    file: UploadFile = File(...),
    top_n: int = Query(5, ge=1, le=MAX_TOP_N),
):
    print(
        f"[routes] Received search request filename={getattr(file,'filename',None)} top_n={top_n}"
    )
    if services.EMBEDDINGS_MATRIX is None or len(services.EMBEDDING_FILENAMES) == 0:
        print("[routes] Embeddings not loaded")
        raise HTTPException(status_code=500, detail="Embeddings not loaded")

    # Save uploaded image to uploads directory and build a public URL
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    uploads_dir = os.path.join(backend_dir, "resources", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

    contents = await file.read()
    # create a safe unique filename
    orig = getattr(file, "filename", "upload.jpg")
    ext = os.path.splitext(orig)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(uploads_dir, filename)
    try:
        with open(save_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        print(f"[routes] Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    try:
        image = Image.open(save_path).convert("RGB")
    except Exception as e:
        print(f"[routes] Invalid uploaded image after save: {e}")
        raise HTTPException(status_code=400, detail="Invalid image uploaded")

    try:
        emb_np = services.encode_image_tensor(image)
    except Exception as e:
        print(f"[routes] Failed to encode image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to encode image: {e}")

    sims = services.compute_similarities(emb_np, services.EMBEDDINGS_MATRIX)
    top_idx = np.argsort(-sims)[:top_n]
    results = [
        {"filename": services.EMBEDDING_FILENAMES[int(i)], "score": float(sims[int(i)])}
        for i in top_idx
    ]
    # Build uploaded file URL using request.base_url
    base = str(request.base_url).rstrip("/")
    uploaded_url = f"{base}/uploads/{filename}"
    print(f"[routes] Returning {len(results)} results, uploaded_url={uploaded_url}")
    return {"uploaded_url": uploaded_url, "results": results}
