import cv2
import numpy as np
import httpx
import base64
import binascii


from insightface.app import FaceAnalysis

face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=0)

client = httpx.AsyncClient(timeout=10)


class NoFaceFoundError(Exception):
    pass


def load_image_from_base64(image_base64: str):
    if not image_base64:
        raise ValueError("Empty base64")

    # Remove data URI prefix if present
    if image_base64.startswith("data:image"):
        image_base64 = image_base64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_base64)
    except (binascii.Error, ValueError):
        raise ValueError("Invalid base64")

    # Convert bytes to numpy array
    arr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image array to OpenCV format
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    return img



async def load_image_from_url(url: str):
    try:
        res = await client.get(url)
    except Exception:
        raise ValueError("Download failed")

    if res.status_code != 200:
        raise ValueError("Download failed")

    arr = np.frombuffer(res.content, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    return img


def extract_faces_and_embeddings(image):
    from app.schemas import FaceEmbedding, BoundingBox

    faces_detected = face_app.get(image)

    if not faces_detected:
        raise NoFaceFoundError("No face detected")

    faces = []

    for face in faces_detected:
        emb = face.embedding.tolist()
        bbox_raw = face.bbox.astype(int)

        bbox = BoundingBox(
            x=int(bbox_raw[0]),
            y=int(bbox_raw[1]),
            width=int(bbox_raw[2] - bbox_raw[0]),
            height=int(bbox_raw[3] - bbox_raw[1]),
        )

        faces.append(
            FaceEmbedding(
                embedding=[float(v) for v in emb],
                bbox=bbox
            )
        )

    return faces