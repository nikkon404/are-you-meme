# backend/server/services.py
import os
import json
from typing import Optional, Dict
from dataclasses import dataclass

import numpy as np
import torch
from PIL import Image
import faiss
import mediapipe as mp

try:
    from deepface import DeepFace  # type: ignore

    _DEEPFACE_AVAILABLE = True
except Exception:
    _DEEPFACE_AVAILABLE = False

from models.clip_encoder import load_clip_model, encode_image
from .config import EMBEDDINGS_FILE, FAISS_INDEX_FILE, FAISS_METADATA_FILE


@dataclass
class CLIPService:
    model: any
    preprocess: any
    device: str
    faiss_index: faiss.Index
    filenames: list[str]
    # lightweight helpers (created at init)
    pose_estimator: any = None
    hands_detector: any = None
    face_cascade: any = None

    def encode_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess & encode a PIL image -> normalized numpy vector."""
        if self.model is None or self.preprocess is None:
            raise RuntimeError("Model not initialized")

        img_t = self.preprocess(image).unsqueeze(0).to(self.device)
        emb = encode_image(self.model, img_t)
        emb_np = emb.detach().cpu().numpy().astype(np.float32)
        return emb_np

    def encode_image_augmented(self, image: Image.Image) -> np.ndarray:
        """Encode with simple test-time augmentation and return a normalized vector.

        Averages embeddings from the original and a horizontal flip to reduce
        sensitivity to pose/mirror variations, then re-normalize.
        """
        variants = [image]
        try:
            variants.append(image.transpose(Image.FLIP_LEFT_RIGHT))
        except Exception:
            # If flip fails for any reason, ignore
            pass

        embs = []
        for img in variants:
            embs.append(self.encode_image(img).reshape(-1).astype(np.float32))

        if len(embs) == 1:
            avg = embs[0]
        else:
            avg = np.mean(np.stack(embs, axis=0), axis=0)

        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm
        return avg.astype(np.float32)

    def find_similar_images(self, image: Image.Image, top_n: int = 1) -> list[dict]:
        """Find similar images and return their filenames and scores.

        Uses a two-step approach for better diversity:
        1) Retrieve a larger candidate pool by cosine similarity to the query.
        2) Apply MMR (Maximal Marginal Relevance) re-ranking to promote diversity
           in the final top_n selections so results are not dominated by near-duplicates.
        """
        if self.faiss_index is None or self.filenames is None:
            raise RuntimeError("Service not fully initialized")

        # Encode query image using the same hybrid recipe used to build FAISS vectors
        query_emb = generate_hybrid_embedding(image)

        # Compute similarities
        q = query_emb.astype(np.float32).reshape(-1)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return []
        q = q / q_norm

        D, I = self.faiss_index.search(
            q.reshape(1, -1).astype(np.float32), min(5 * top_n, len(self.filenames))
        )
        sims = D[0]
        candidate_idx = I[0]

        pool_size = len(candidate_idx)

        # Step 2: MMR re-ranking for diversity
        # lambda controls relevance vs diversity trade-off (1.0 => relevance only)
        mmr_lambda = 0.7
        selected: list[int] = []

        if pool_size <= top_n:
            selected = list(candidate_idx[:top_n])
        else:
            # Always pick the most relevant first
            selected.append(int(candidate_idx[0]))
            candidate_set = set(int(i) for i in candidate_idx[1:])

            while len(selected) < top_n and candidate_set:
                best_i = None
                best_score = -1e9
                for i in list(candidate_set):
                    relevance = float(sims[candidate_idx.tolist().index(i)])
                    if not selected:
                        diversity_penalty = 0.0
                    else:
                        # use max similarity to already selected as redundancy measure
                        sel_indices = [
                            candidate_idx.tolist().index(s)
                            for s in selected
                            if s in candidate_idx
                        ]
                        if sel_indices:
                            sel_embs = np.array(
                                [self.faiss_index.reconstruct(s) for s in selected]
                            )
                            try:
                                candidate_emb = self.faiss_index.reconstruct(i)
                                diversity_penalty = float(
                                    np.max(sel_embs @ candidate_emb)
                                )
                            except Exception:
                                diversity_penalty = 0.0
                        else:
                            diversity_penalty = 0.0
                    mmr_score = (
                        mmr_lambda * relevance - (1.0 - mmr_lambda) * diversity_penalty
                    )
                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_i = i

                if best_i is None:
                    break
                selected.append(int(best_i))
                candidate_set.remove(int(best_i))

        filenames = self.filenames

        return [
            {
                "filename": filenames[int(i)],
                "score": float(sims[candidate_idx.tolist().index(i)]),
            }
            for i in selected[:top_n]
        ]

    def is_initialized(self) -> bool:
        """Check if service is fully initialized."""
        return (
            self.model is not None
            and self.faiss_index is not None
            and self.filenames is not None
        )


# Global service instance
clip_service: Optional[CLIPService] = None


def init(device: str = None) -> None:
    """Initialize CLIP service and load FAISS index and metadata."""
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

    faiss_index = None
    filenames = None
    if os.path.exists(FAISS_INDEX_FILE) and os.path.exists(FAISS_METADATA_FILE):
        try:
            print(f"[services] Loading FAISS index from {FAISS_INDEX_FILE}")
            faiss_index = faiss.read_index(FAISS_INDEX_FILE)
            with open(FAISS_METADATA_FILE, "r") as f:
                filenames = json.load(f)
            print(f"[services] FAISS index loaded with {len(filenames)} items")
        except Exception as e:
            print(f"[services] Failed to load FAISS index: {e}")
            raise RuntimeError(f"Failed to load FAISS index: {str(e)}")
    else:
        raise RuntimeError("FAISS index or metadata file not found")

    clip_service = CLIPService(
        model=model,
        preprocess=preprocess,
        device=device,
        faiss_index=faiss_index,
        filenames=filenames,
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
                "embeddings_count": len(clip_service.filenames or []),
            }
        )

    return status


# For backward compatibility only
def get_device() -> str:
    return clip_service.device if clip_service else "cpu"


DEVICE = property(get_device)
MODEL = property(lambda: clip_service.model if clip_service else None)


def faiss_index_initialized() -> bool:
    """Return True if the FAISS-backed service is ready for queries."""
    return bool(clip_service and clip_service.is_initialized())


# --- Hybrid embedding config (must match generator) ---
# IMPROVED WEIGHTS: More pose/action focused, less face focused
CLIP_WEIGHT = 0.20  # Reduced from 0.4 (less facial bias)
EMOTION_WEIGHT = 0.10  # Reduced from 0.3 (less face focus)
POSE_WEIGHT = 0.40  # Increased from 0.2 (more body pose)
HAND_WEIGHT = 0.25  # NEW: Hand gesture detection
OBJECT_WEIGHT = 0.05  # Reduced from 0.1 (minimal)

# Face masking config
USE_FACE_MASKING = True  # Make CLIP focus on non-face features
FACE_MASK_WEIGHT = 0.7  # 70% masked version, 30% original


def _get_pose_estimator():
    global clip_service
    if clip_service and getattr(clip_service, "pose_estimator", None) is None:
        try:
            clip_service.pose_estimator = mp.solutions.pose.Pose(static_image_mode=True)
        except Exception:
            clip_service.pose_estimator = None
    return clip_service.pose_estimator if clip_service else None


def _get_hands_detector():
    global clip_service
    if clip_service and getattr(clip_service, "hands_detector", None) is None:
        try:
            clip_service.hands_detector = mp.solutions.hands.Hands(
                static_image_mode=True, max_num_hands=2
            )
        except Exception:
            clip_service.hands_detector = None
    return clip_service.hands_detector if clip_service else None


def _get_face_cascade():
    global clip_service
    if clip_service and getattr(clip_service, "face_cascade", None) is None:
        try:
            import cv2

            clip_service.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
        except Exception:
            clip_service.face_cascade = None
    return clip_service.face_cascade if clip_service else None


def generate_hybrid_embedding(image: Image.Image) -> np.ndarray:
    """Generate a hybrid embedding (CLIP + emotion + pose + hands), normalized.

    This mirrors backend/scripts/generate_embeddings_improved.py so query vectors
    are compatible with the FAISS index built there.

    IMPROVED VERSION:
    - Optional face masking to reduce facial bias in CLIP
    - Hand gesture detection added
    - Rebalanced weights (more pose/action, less face)
    """
    if clip_service is None or not clip_service.model or not clip_service.preprocess:
        raise RuntimeError("Service not initialized")

    # Encode image with CLIP model (with optional face masking)
    if USE_FACE_MASKING:
        face_cascade = _get_face_cascade()
        if face_cascade is not None:
            try:
                import cv2
                from PIL import ImageDraw

                # Detect faces
                img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                faces = face_cascade.detectMultiScale(
                    img_cv, scaleFactor=1.1, minNeighbors=4
                )

                # Create masked version
                masked_img = image.copy()
                if len(faces) > 0:
                    draw = ImageDraw.Draw(masked_img)
                    for x, y, w, h in faces:
                        # Fill face with neutral gray
                        draw.rectangle([x, y, x + w, y + h], fill=(128, 128, 128))

                # Encode both versions
                original_emb = (
                    clip_service.encode_image(image).reshape(-1).astype(np.float32)
                )
                masked_emb = (
                    clip_service.encode_image(masked_img).reshape(-1).astype(np.float32)
                )

                # Combine: more weight on masked version
                clip_vec = (
                    1 - FACE_MASK_WEIGHT
                ) * original_emb + FACE_MASK_WEIGHT * masked_emb
                clip_norm = np.linalg.norm(clip_vec)
                if clip_norm > 0:
                    clip_vec = clip_vec / clip_norm
            except Exception:
                # Fallback to standard encoding
                clip_vec = (
                    clip_service.encode_image(image).reshape(-1).astype(np.float32)
                )
                clip_norm = np.linalg.norm(clip_vec)
                if clip_norm > 0:
                    clip_vec = clip_vec / clip_norm
        else:
            # Face cascade not available, use standard encoding
            clip_vec = clip_service.encode_image(image).reshape(-1).astype(np.float32)
            clip_norm = np.linalg.norm(clip_vec)
            if clip_norm > 0:
                clip_vec = clip_vec / clip_norm
    else:
        # Standard CLIP encoding (no masking)
        clip_vec = clip_service.encode_image(image).reshape(-1).astype(np.float32)
        clip_norm = np.linalg.norm(clip_vec)
        if clip_norm > 0:
            clip_vec = clip_vec / clip_norm

    # Use the same CLIP embedding as the object embedding (matches generation script)
    object_vec = clip_vec.copy()

    # Emotion embedding (DeepFace with OpenCV backend)
    if _DEEPFACE_AVAILABLE:
        try:
            import cv2

            np_img = np.array(image.convert("RGB"))
            # DeepFace expects BGR format for OpenCV
            np_img_bgr = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
            emo_pred = DeepFace.analyze(
                np_img_bgr, actions=["emotion"], enforce_detection=False
            )
            emo_vec = np.array(list(emo_pred[0]["emotion"].values()), dtype=np.float32)
            emo_norm = np.linalg.norm(emo_vec)
            if emo_norm > 0:
                emo_vec = emo_vec / emo_norm
        except Exception:
            emo_vec = np.zeros(7, dtype=np.float32)
    else:
        emo_vec = np.zeros(7, dtype=np.float32)

    # Pose embedding (MediaPipe)
    pose_estimator = _get_pose_estimator()
    if pose_estimator is not None:
        try:
            np_img = np.array(image)
            pose_result = pose_estimator.process(np_img)
            if pose_result.pose_landmarks:
                pts = [(lm.x, lm.y) for lm in pose_result.pose_landmarks.landmark]
                pose_vec = np.array([c for pt in pts for c in pt], dtype=np.float32)
                pose_norm = np.linalg.norm(pose_vec)
                if pose_norm > 0:
                    pose_vec = pose_vec / pose_norm
            else:
                pose_vec = np.zeros(66, dtype=np.float32)
        except Exception:
            pose_vec = np.zeros(66, dtype=np.float32)
    else:
        pose_vec = np.zeros(66, dtype=np.float32)

    # Hand gesture embedding (MediaPipe Hands) - NEW!
    # Always create a 126-dimensional vector (2 hands × 21 landmarks × 3 coords)
    # Pad with zeros if fewer hands detected
    hands_detector = _get_hands_detector()
    hand_vec = np.zeros(126, dtype=np.float32)  # Max 2 hands × 21 landmarks × 3 coords

    if hands_detector is not None:
        try:
            np_img = np.array(image)
            hands_result = hands_detector.process(np_img)

            if hands_result.multi_hand_landmarks:
                hand_pts = []
                for hand_landmarks in hands_result.multi_hand_landmarks[
                    :2
                ]:  # Max 2 hands
                    hand_pts.extend(
                        [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]
                    )

                # Fill the hand_vec with detected values (rest remain zeros)
                hand_data = np.array(
                    [c for pt in hand_pts for c in pt], dtype=np.float32
                )
                hand_vec[: len(hand_data)] = hand_data

                if np.linalg.norm(hand_vec) > 0:
                    hand_vec = hand_vec / np.linalg.norm(hand_vec)
        except Exception:
            pass  # hand_vec already initialized to zeros

    # Combine all components with weights (must match generate_embeddings_improved.py order)
    combined = np.concatenate(
        [
            clip_vec * CLIP_WEIGHT,
            object_vec * OBJECT_WEIGHT,
            emo_vec * EMOTION_WEIGHT,
            pose_vec * POSE_WEIGHT,
            hand_vec * HAND_WEIGHT,
        ]
    ).astype(np.float32)

    # Final normalization
    norm = np.linalg.norm(combined)
    if norm > 0:
        combined = combined / norm

    return combined
