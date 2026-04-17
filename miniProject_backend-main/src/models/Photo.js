/** Photos table (photos). Use getPool() and pool.query(...) */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'photos' };
