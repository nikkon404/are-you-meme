import torch
import clip


def load_clip_model(device):
    """Load the CLIP model and return model and preprocess function"""
    model, preprocess = clip.load("ViT-B/32", device=device)
    return model, preprocess


def encode_image(model, image):
    """Encode an image using CLIP model"""
    with torch.no_grad():
        image_features = model.encode_image(image)
        # Normalize the features
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        return image_features[0]  # Return the first (and only) embedding
