import os
import torch
import clip


def load_clip_model(device):
    """Load the CLIP model and return model and preprocess function.

    Force downloads/caches into a writable directory inside the container
    to avoid permission errors on environments where HOME points to '/'.
    """
    download_root = os.environ.get("CLIP_CACHE_DIR", "/tmp/clip")
    os.makedirs(download_root, exist_ok=True)
    model, preprocess = clip.load(
        "ViT-B/32", device=device, download_root=download_root
    )
    return model, preprocess


def encode_image(model, image):
    """Encode an image using CLIP model"""
    with torch.no_grad():
        image_features = model.encode_image(image)
        # Normalize the features
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        return image_features[0]  # Return the first (and only) embedding
