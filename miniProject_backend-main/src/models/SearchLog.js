/** Search logs table (search_logs). Use getPool() and pool.query(...) */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'search_logs' };
