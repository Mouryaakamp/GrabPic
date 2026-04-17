from fastapi import FastAPI, HTTPException

from app.services.face_embedding import (
    load_image_from_base64,
    load_image_from_url,
    extract_faces_and_embeddings,
    NoFaceFoundError,
)

app = FastAPI()


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/process")
async def process(request: dict):
    try:
        image_base64 = request.get("imageBase64")
        image_url = request.get("imageUrl")

        if not image_base64 and not image_url:
            raise HTTPException(status_code=400, detail="No input provided")

        # ✅ Load image
        if image_base64:
            image = load_image_from_base64(image_base64)
        else:
            image = await load_image_from_url(image_url)

        # ✅ Extract faces
        faces = extract_faces_and_embeddings(image)

        # ✅ IMPORTANT: Convert objects → JSON
        return {
            "faces": [
                {
                    "embedding": f.embedding,
                    "bbox": {
                        "x": f.bbox.x,
                        "y": f.bbox.y,
                        "width": f.bbox.width,
                        "height": f.bbox.height,
                    }
                }
                for f in faces
            ]
        }

    except NoFaceFoundError as e:
        # ✅ No face = valid case
        return {"faces": []}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # ✅ SHOW REAL ERROR (VERY IMPORTANT)
        print("🔥 ML ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))