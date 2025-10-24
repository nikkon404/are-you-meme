# backend/tester.py

import os
import json
import torch
import clip
from PIL import Image
import numpy as np
from models.clip_encoder import load_clip_model, encode_image
from sklearn.metrics.pairwise import cosine_similarity

# ---------- Config ----------
BASE_DIR = os.path.dirname(__file__)
MEME_EMBEDDINGS_FILE = os.path.join(
    BASE_DIR, "resources", "embeddings", "embeddings.json"
)
TOP_K = 5  # number of top memes to show

# ---------- Load meme embeddings ----------
with open(MEME_EMBEDDINGS_FILE, "r") as f:
    embeddings_data = json.load(f)

# Convert embeddings to tensor and keep filenames
meme_filenames = list(embeddings_data.keys())
meme_embeddings = torch.tensor([embeddings_data[f] for f in meme_filenames])

# ---------- Load CLIP ----------
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = load_clip_model(device)
model.to(device)
model.eval()

# ---------- Input ----------
# Ask for a test image path, with a sensible default in resources
default_image = os.path.join(BASE_DIR, "resources", "test_image.jpg")
prompt = f"Path to test image (press Enter to use default: {default_image}): "
image_path = input(prompt).strip()
if image_path == "":
    image_path = default_image

if not os.path.isfile(image_path):
    print(f"File does not exist: {image_path}")
    exit(1)
else:
    print(f"Processing image: {image_path}")

# ---------- Process image ----------
image = Image.open(image_path).convert("RGB")
image_tensor = preprocess(image).unsqueeze(0).to(device)
input_embedding = encode_image(model, image_tensor).unsqueeze(0)  # shape [1, 512]

# ---------- Compute cosine similarity ----------
meme_embeddings_norm = meme_embeddings / meme_embeddings.norm(dim=1, keepdim=True)
input_embedding_norm = input_embedding / input_embedding.norm(dim=1, keepdim=True)
similarities = torch.matmul(input_embedding_norm, meme_embeddings_norm.T).squeeze(0)

# ---------- Get top matches ----------
topk_values, topk_indices = torch.topk(similarities, TOP_K)
print(f"\nTop {TOP_K} matching memes:")
for i, idx in enumerate(topk_indices):
    print(f"{i+1}. {meme_filenames[idx]} (score: {topk_values[i]:.4f})")
