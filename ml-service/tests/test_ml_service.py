import base64
import numpy as np
import pytest
import pytest_asyncio
from unittest.mock import patch
from httpx import AsyncClient, ASGITransport


def make_transport():
    from app.main import app
    return ASGITransport(app=app)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=make_transport(), base_url="http://test") as c:
        yield c


def _tiny_jpeg_b64():
    import cv2
    img = np.ones((100, 100, 3), dtype=np.uint8) * 255
    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf.tobytes()).decode()


# ───────── HEALTH ─────────

class TestHealth:
    @pytest.mark.asyncio
    async def test_health(self, client):
        res = await client.get("/")
        assert res.status_code == 200


# ───────── INPUT ─────────

class TestInput:
    @pytest.mark.asyncio
    async def test_empty_body(self, client):
        res = await client.post("/process", json={})
        assert res.status_code == 400

    @pytest.mark.asyncio
    async def test_invalid_base64(self, client):
        res = await client.post("/process", json={"imageBase64": "bad"})
        assert res.status_code == 400

    @pytest.mark.asyncio
    async def test_valid_base64_no_face(self, client):
        res = await client.post("/process", json={"imageBase64": _tiny_jpeg_b64()})
        assert res.status_code in (200, 400)


# ───────── RESPONSE ─────────

class TestResponse:
    def _mock_extract(self, *args, **kwargs):
        from app.schemas import FaceEmbedding, BoundingBox
        return [FaceEmbedding(embedding=[0.1]*512, bbox=BoundingBox(x=0,y=0,width=10,height=10))]

    @pytest.mark.asyncio
    async def test_success_response(self, client):
        with patch("app.main.extract_faces_and_embeddings", self._mock_extract), \
             patch("app.main.load_image_from_base64", return_value=np.zeros((100,100,3))):

            res = await client.post("/process", json={"imageBase64": _tiny_jpeg_b64()})
            assert res.status_code == 200


# ───────── SERVICE ─────────

class TestService:
    def test_invalid_base64(self):
        from app.services.face_embedding import load_image_from_base64
        with pytest.raises(ValueError):
            load_image_from_base64("bad")

    def test_non_image(self):
        from app.services.face_embedding import load_image_from_base64
        garbage = base64.b64encode(b"hello").decode()
        with pytest.raises(ValueError):
            load_image_from_base64(garbage)

    def test_embedding_validation(self):
        from app.services.face_embedding import extract_faces_and_embeddings

        mock = [{
            "embedding": [0.1] * 128,
            "facial_area": {"x": 0, "y": 0, "w": 10, "h": 10},
        }]

        with patch("app.services.face_embedding._import_deepface") as mock_import:
            mock_import.return_value.represent.return_value = mock

            with pytest.raises(RuntimeError):
                extract_faces_and_embeddings(np.zeros((100,100,3)))