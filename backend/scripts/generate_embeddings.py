# backend/scripts/generate_embeddings_improved.py
"""
IMPROVED VERSION with:
1. Rebalanced weights (more pose, less face)
2. Hand gesture detection added
3. Optional face masking for CLIP
"""

print("🚀 Starting IMPROVED hybrid embedding generation...")

print("Importing dependencies...")
import os, json, numpy as np, torch, faiss, sys
from PIL import Image, ImageDraw
import cv2

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.clip_encoder import load_clip_model, encode_image
import mediapipe as mp

# Try to import DeepFace
try:
    from deepface import DeepFace  # type: ignore

    DEEPFACE_AVAILABLE = True
    print("✅ DeepFace available: emotion features enabled")
except Exception as e:
    DEEPFACE_AVAILABLE = False
    print(f"⚠️ DeepFace unavailable (emotion features disabled): {e}")

print("Import Completed")

# --- Configuration ---
USE_FACE_MASKING = True  # Set to True to make CLIP focus on non-face features
FACE_MASK_WEIGHT = (
    0.7  # How much to weight the masked version (0.7 = 70% masked, 30% original)
)

print("Importing paths...")
# --- Paths ---
BASE_DIR = os.path.dirname(__file__)
MEME_DIR = os.path.join(BASE_DIR, "../resources/memes")
OUT_DIR = os.path.join(BASE_DIR, "../resources/embeddings")
os.makedirs(OUT_DIR, exist_ok=True)
print("Paths imported")

print("Setting up models...")
# --- Model setup ---
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🧠 Using device: {device}")

clip_model, preprocess = load_clip_model(device)
pose_estimator = mp.solutions.pose.Pose(static_image_mode=True)
hands_detector = mp.solutions.hands.Hands(static_image_mode=True, max_num_hands=2)

# Load face detector for masking
if USE_FACE_MASKING:
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    print("✅ Face masking enabled")

print("Models setup completed")

print("Setting up parameters...")
# --- IMPROVED Parameters (more pose-focused) ---
CLIP_WEIGHT = 0.20  # Reduced from 0.4
EMOTION_WEIGHT = 0.10  # Reduced from 0.3
POSE_WEIGHT = 0.40  # Increased from 0.2
HAND_WEIGHT = 0.25  # NEW: Hand gesture detection
OBJECT_WEIGHT = (
    0.05  # Minimal (could be removed or replaced with real object detection)
)

print(
    f"""
📊 Weight Distribution:
   - CLIP (semantic):  {CLIP_WEIGHT:.0%}
   - Emotion (face):   {EMOTION_WEIGHT:.0%}
   - Pose (body):      {POSE_WEIGHT:.0%}
   - Hand (gestures):  {HAND_WEIGHT:.0%}
   - Object:           {OBJECT_WEIGHT:.0%}
   
   Face-related: {CLIP_WEIGHT + EMOTION_WEIGHT:.0%}
   Action-related: {POSE_WEIGHT + HAND_WEIGHT:.0%}
"""
)

print("Parameters set up")

# --- Containers ---
embeddings = {}
vectors = []
filenames = []


def get_clip_embedding_with_optional_masking(image, clip_model, preprocess, device):
    """Encode image with optional face masking to focus on pose/scene"""
    if not USE_FACE_MASKING:
        # Standard encoding
        img_tensor = preprocess(image).unsqueeze(0).to(device)
        return encode_image(clip_model, img_tensor).cpu().numpy().flatten()

    # Detect and mask faces
    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    faces = face_cascade.detectMultiScale(img_cv, scaleFactor=1.1, minNeighbors=4)

    # Create masked version
    masked_img = image.copy()
    if len(faces) > 0:
        draw = ImageDraw.Draw(masked_img)
        for x, y, w, h in faces:
            # Fill face with neutral gray
            draw.rectangle([x, y, x + w, y + h], fill=(128, 128, 128))

    # Encode both versions
    original_tensor = preprocess(image).unsqueeze(0).to(device)
    masked_tensor = preprocess(masked_img).unsqueeze(0).to(device)

    original_emb = encode_image(clip_model, original_tensor).cpu().numpy().flatten()
    masked_emb = encode_image(clip_model, masked_tensor).cpu().numpy().flatten()

    # Combine: more weight on masked version
    combined = (1 - FACE_MASK_WEIGHT) * original_emb + FACE_MASK_WEIGHT * masked_emb
    combined = combined / np.linalg.norm(combined)

    return combined


# --- Loop over meme images ---
image_files = [
    f
    for f in sorted(os.listdir(MEME_DIR))
    if f.lower().endswith((".png", ".jpg", ".jpeg"))
]
print(f"🖼 Found {len(image_files)} meme images to process")

for idx, filename in enumerate(image_files, 1):
    path = os.path.join(MEME_DIR, filename)
    print(f"\n[{idx}/{len(image_files)}] Processing: {filename}")
    try:
        image = Image.open(path).convert("RGB")

        # --- CLIP embedding (with optional face masking) ---
        clip_vec = get_clip_embedding_with_optional_masking(
            image, clip_model, preprocess, device
        )
        clip_vec = clip_vec / np.linalg.norm(clip_vec)

        # --- Object embedding (minimal weight, or could be replaced) ---
        object_vec = clip_vec.copy()

        # --- Emotion embedding ---
        if DEEPFACE_AVAILABLE:
            try:
                emo_pred = DeepFace.analyze(
                    path, actions=["emotion"], enforce_detection=False
                )
                emo_vec = np.array(list(emo_pred[0]["emotion"].values()))
                emo_vec = emo_vec / np.linalg.norm(emo_vec)
            except Exception as e:
                print(f"⚠️ Emotion detection failed: {e}")
                emo_vec = np.zeros(7)
        else:
            emo_vec = np.zeros(7)

        # --- Pose embedding ---
        pose_result = pose_estimator.process(np.array(image))
        if pose_result.pose_landmarks:
            pts = [(lm.x, lm.y) for lm in pose_result.pose_landmarks.landmark]
            pose_vec = np.array([coord for pt in pts for coord in pt])
            pose_vec = pose_vec / np.linalg.norm(pose_vec)
        else:
            pose_vec = np.zeros(66)

        # --- NEW: Hand gesture embedding ---
        # Always create a 126-dimensional vector (2 hands × 21 landmarks × 3 coords)
        # Pad with zeros if fewer hands detected
        hands_result = hands_detector.process(np.array(image))
        hand_vec = np.zeros(
            126, dtype=np.float32
        )  # Max 2 hands × 21 landmarks × 3 coords

        if hands_result.multi_hand_landmarks:
            hand_pts = []
            for hand_landmarks in hands_result.multi_hand_landmarks[:2]:  # Max 2 hands
                hand_pts.extend([(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark])

            # Fill the hand_vec with detected values (rest remain zeros)
            hand_data = np.array(
                [coord for pt in hand_pts for coord in pt], dtype=np.float32
            )
            hand_vec[: len(hand_data)] = hand_data

            if np.linalg.norm(hand_vec) > 0:
                hand_vec = hand_vec / np.linalg.norm(hand_vec)
            print(f"  ✋ Detected {len(hands_result.multi_hand_landmarks)} hand(s)")

        # --- Combine weighted hybrid vector ---
        hybrid_vec = np.concatenate(
            [
                clip_vec * CLIP_WEIGHT,
                object_vec * OBJECT_WEIGHT,
                emo_vec * EMOTION_WEIGHT,
                pose_vec * POSE_WEIGHT,
                hand_vec * HAND_WEIGHT,
            ]
        )
        hybrid_vec = hybrid_vec / np.linalg.norm(hybrid_vec)

        # --- Store ---
        filenames.append(filename)
        vectors.append(hybrid_vec)

    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")
        import traceback

        traceback.print_exc()

# --- Save embeddings.json (optional, for debugging) ---

# --- Save metadata ---
with open(os.path.join(OUT_DIR, "metadata.json"), "w") as f:
    json.dump(filenames, f)

# --- Build FAISS index ---
matrix = np.vstack(vectors).astype("float32")
dim = matrix.shape[1]
print(f"\n📐 Final embedding dimension: {dim}")
print(f"   CLIP: 512, Object: 512, Emotion: 7, Pose: 66, Hand: 126")
index = faiss.IndexFlatIP(dim)  # cosine similarity
index.add(matrix)
faiss.write_index(index, os.path.join(OUT_DIR, "hybrid.index"))

print(f"\n✅ Done! Generated {len(filenames)} embeddings.")
print(f"📦 hybrid.index ({dim} dims) and metadata.json are ready.")
print("\n🎯 The system should now be much more sensitive to:")
print("   - Body pose and posture")
print("   - Hand gestures and positions")
print("   - Actions (hands up, pointing, etc.)")
print("   - Less focused on facial similarity")
