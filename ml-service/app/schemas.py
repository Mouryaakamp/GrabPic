from pydantic import BaseModel
from typing import List


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class FaceEmbedding(BaseModel):
    embedding: List[float]
    bbox: BoundingBox


class ProcessResponse(BaseModel):
    faces: List[FaceEmbedding]