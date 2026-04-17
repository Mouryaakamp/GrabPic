/**
 * Init DB: enable pgvector and create tables from src/models/schema.js.
 * Usage: node scripts/init-db.js
 */

require('dotenv').config();
console.log("INIT SCRIPT STARTED");
const { getPool, connectDB, disconnectDB } = require('../src/config/database');
const { getCreateTablesSql } = require('../src/models/schema');

const initDatabase = async () => {
  const pool = getPool();
  try {
    console.log('Connecting to PostgreSQL...');
    await connectDB();

    console.log('Enabling pgvector...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

    console.log('Creating tables...');
    for (const sql of getCreateTablesSql()) {
      await pool.query(sql);
    }

    console.log('Database ready.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

initDatabase();
