/** Faces table (faces). Vector search: ORDER BY embedding <=> $1. Use getPool() and pool.query(...) */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'faces' };
