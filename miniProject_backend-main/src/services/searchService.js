const { randomUUID } = require('crypto');
const { getPool } = require('../config/database');
const s3Util = require('../utils/s3');

const {
  ML_EMBEDDING_URL,
  PHOTO_PROCESSING_STATUS
} = require('../config/constants');

/* ---------------- ML EMBEDDING ---------------- */

async function getEmbeddingFromML(imageBase64) {

  if (!ML_EMBEDDING_URL) {
    return Array(512).fill(0).map(() => Math.random() * 0.01);
  }

  const res = await fetch(`${ML_EMBEDDING_URL}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true'
    },
    body: JSON.stringify({
      imageBase64: imageBase64
    })
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errData = await res.json();
      errorDetail = errData.detail || res.statusText;
    } catch(e) {}
    throw new Error(`ML service error: ${errorDetail}`);
  }

  const data = await res.json();

  if (!data.faces || data.faces.length === 0) {
    throw new Error('No face detected');
  }

  return data.faces[0].embedding;
}

/* ---------------- SEARCH ---------------- */

async function searchFaces(eventId, userId, embedding, limit = 50) {

  const pool = getPool();

  const vectorStr = `[${embedding.join(',')}]`;

  const { rows } = await pool.query(
    `SELECT photo_id,
            MAX(1 - (embedding <=> $1::vector)) AS score
     FROM faces
     WHERE event_id=$2
     GROUP BY photo_id
     HAVING MAX(1 - (embedding <=> $1::vector)) > 0.40
     ORDER BY score DESC
     LIMIT $3`,
    [vectorStr, eventId, limit]
  );

  const searchLogId = randomUUID();

  await pool.query(
    `INSERT INTO search_logs (id,user_id,event_id)
     VALUES ($1,$2,$3)`,
    [searchLogId, userId, eventId]
  );

  const matches = [];

  for (const r of rows) {

    const photo = await pool.query(
      `SELECT id,storage_key
       FROM photos
       WHERE id=$1
         AND event_id=$2
         AND processing_status=$3`,
      [r.photo_id, eventId, PHOTO_PROCESSING_STATUS.PROCESSED]
    );

    if (photo.rows.length === 0) continue;

    const { url } =
      await s3Util.getPresignedDownloadUrl(
        photo.rows[0].storage_key
      );

    matches.push({
      photo_id: r.photo_id,
      score: parseFloat(r.score),
      thumbnail_url: url
    });
  }

  return {
    matches,
    search_log_id: searchLogId
  };
}

module.exports = {
  getEmbeddingFromML,
  searchFaces
};