/** Event table (events). Use getPool() and pool.query('SELECT ... FROM events ...') */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'events' };
