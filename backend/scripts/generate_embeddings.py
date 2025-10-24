# backend/scripts/generate_embeddings.py

import os
import json
from PIL import Image
import torch
from torchvision import transforms
from models.clip_encoder import load_clip_model, encode_image

print("Starting embedding generation script...")

# Paths
MEME_DIR = os.path.join(os.path.dirname(__file__), "../resources/memes")
EMBEDDINGS_DIR = os.path.join(os.path.dirname(__file__), "../resources/embeddings")
EMBEDDINGS_FILE = os.path.join(EMBEDDINGS_DIR, "embeddings.json")

print(f"Meme directory: {MEME_DIR}")
print(f"Embeddings will be saved to: {EMBEDDINGS_FILE}")

# Create embeddings folder if it doesn't exist
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
print(f"Ensured embeddings directory exists at: {EMBEDDINGS_DIR}")

# Load CLIP model
print("Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
model, preprocess = load_clip_model(device)
print("CLIP model loaded successfully")

# Store embeddings here
embeddings_dict = {}

# Get list of image files
filenames = [
    f
    for f in sorted(os.listdir(MEME_DIR))
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
]


# Loop through meme images
for idx, filename in enumerate(filenames, 1):
    print(f"\nProcessing image {idx}/{len(filenames)}: {filename}")
    path = os.path.join(MEME_DIR, filename)
    try:
        print(f"Loading image from: {path}")
        image = Image.open(path).convert("RGB")
        print("Preprocessing image...")
        image_tensor = preprocess(image).unsqueeze(0).to(device)
        print("Generating embedding...")
        embedding = encode_image(model, image_tensor)  # returns a 512-d vector
        embeddings_dict[filename] = embedding.tolist()
        print(f"Successfully generated embedding for: {filename}")
    except Exception as e:
        print(f"ERROR: Failed to process {filename}: {e}")

# Save embeddings to JSON
print(f"\nSaving embeddings to: {EMBEDDINGS_FILE}")
with open(EMBEDDINGS_FILE, "w") as f:
    json.dump(embeddings_dict, f, separators=(",", ":"))

print(f"Successfully saved embeddings for {len(embeddings_dict)} memes")
print("Script completed!")
