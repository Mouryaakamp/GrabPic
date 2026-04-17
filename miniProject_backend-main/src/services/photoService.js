const { randomUUID } = require('crypto');
const { getPool } = require('../config/database');
const { enqueueFaceJob } = require('../queue/faceProcessingQueue');

const s3Util = require('../utils/s3');

const {
  PHOTO_PROCESSING_STATUS
} = require('../config/constants');

/* PRESIGN */

async function createPresignedPut(eventId, filename, contentType) {

  const photoId = randomUUID();

  const storage_key =
    s3Util.buildPhotoKey(eventId, photoId, filename);

  const upload_url =
    await s3Util.getPresignedPutUrl(storage_key, contentType);

  return { photoId, storage_key, upload_url };
}

/* CREATE DB RECORD */

async function createPhotoRecord(eventId, photoId, storageKey) {

  const pool = getPool();

  await pool.query(
    `INSERT INTO photos (id,event_id,storage_key,processing_status)
     VALUES ($1,$2,$3,$4)`,
    [photoId, eventId, storageKey, PHOTO_PROCESSING_STATUS.PENDING]
  );
}

/* CONFIRM */
async function confirmPhotoUpload(eventId, photoId, storageKey) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id FROM photos WHERE id=$1 AND event_id=$2`,
    [photoId, eventId]
  );

  if (rows.length === 0) return null;

  //  NON-BLOCKING
  enqueueFaceJob({
    photoId,
    eventId,
    storageKey
  }).catch(err => {
    console.error("Queue failed:", err.message);
  });

  return {
    photo_id: photoId,
    processing_status: PHOTO_PROCESSING_STATUS.PENDING,
    job_id: null
  };
}
/* GET PHOTO */

async function getPhotoById(photoId, eventId) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,storage_key,processing_status,uploaded_at
     FROM photos
     WHERE id=$1 AND event_id=$2`,
    [photoId, eventId]
  );

  return rows[0] || null;
}

/* LIST */

async function listPhotosByEvent(eventId) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,storage_key,processing_status,uploaded_at
     FROM photos
     WHERE event_id=$1
     ORDER BY uploaded_at DESC`,
    [eventId]
  );

  return rows;
}

/* DOWNLOAD */

async function getPresignedDownloadUrl(storageKey) {
  return s3Util.getPresignedDownloadUrl(storageKey);
}

module.exports = {
  createPresignedPut,
  createPhotoRecord,
  confirmPhotoUpload,
  getPhotoById,
  listPhotosByEvent,
  getPresignedDownloadUrl
};