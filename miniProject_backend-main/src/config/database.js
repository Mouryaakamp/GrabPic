/**
 * DB connection (PostgreSQL). Uses pg Pool. Set DATABASE_URL in .env.
 */

require('dotenv').config();
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

async function connectDB() {
  const p = getPool();
  const client = await p.connect();
  client.release();
}

async function disconnectDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, connectDB, disconnectDB };
