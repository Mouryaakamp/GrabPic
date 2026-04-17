/**
 * BullMQ queue for face processing jobs. Enqueue from confirm-upload handler.
 */

const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { REDIS_URL, QUEUE_NAME } = require('../config/constants');

let connection;
let queue;

function getConnection() {
  if (!connection) connection = new IORedis(REDIS_URL);
  return connection;
}

function getQueue() {
  if (!queue) queue = new Queue(QUEUE_NAME, { connection: getConnection() });
  return queue;
}

async function enqueueFaceJob({ photoId, eventId, storageKey }) {
  const job = await getQueue().add(
    'process-photo',
    { photoId, eventId, storageKey },
    { attempts: 5, backoff: 10000, removeOnComplete: true, removeOnFail: false }
  );
  return job.id;
}

module.exports = { getQueue, enqueueFaceJob };
