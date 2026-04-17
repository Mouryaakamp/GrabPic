const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const axios = require('axios');

// ✅ Correct paths (based on your structure)
const { REDIS_URL, QUEUE_NAME } = require('../config/constants');
const { getPool } = require('../config/database');
const { getPresignedDownloadUrl } = require('../utils/s3');

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null
});
console.log("🚀 Worker started... waiting for jobs");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`\n📦 Processing job: ${job.id}`);

    const { photoId, eventId, storageKey } = job.data;
    const pool = getPool();

    try {
      // 1️⃣ Get S3 download URL
      const { url } = await getPresignedDownloadUrl(storageKey);
      console.log("📥 S3 download URL ready");

      // 2️⃣ Call ML service
      let response;

      try {
        response = await axios.post("http://ml-service:8000/process", {
          imageUrl: url
        });
      } catch (err) {
        console.error("🔥 ML ERROR RESPONSE:");
        console.error(err.response?.data);  // 👈 IMPORTANT
        throw err;
      }
      const faces = response.data.faces || [];
      console.log(`🧠 Faces detected: ${faces.length}`);

      // 3️⃣ Store embeddings
      await Promise.all(
        faces.map(face => {
          const vectorStr = `[${face.embedding.map(Number).join(',')}]`;

          return pool.query(
            `INSERT INTO faces (photo_id, event_id, embedding)
       VALUES ($1, $2, $3::vector)`,
            [photoId, eventId, vectorStr]
          );
        })
      );

      // 4️⃣ Update photo status
      await pool.query(
        `UPDATE photos
         SET processing_status = 'processed'
         WHERE id = $1`,
        [photoId]
      );

      console.log(`✅ Job completed: ${photoId}`);

    } catch (err) {
      console.error(`❌ Job failed: ${err.message}`);

      await pool.query(
        `UPDATE photos
         SET processing_status = 'failed'
         WHERE id = $1`,
        [photoId]
      );

      throw err;
    }
  },
  { connection }
);

// 🔔 Events
worker.on('completed', (job) => {
  console.log(`🎉 Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 Failed job ${job?.id}: ${err.message}`);
});