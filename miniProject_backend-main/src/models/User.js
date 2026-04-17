/** User table (users). Use getPool() and pool.query('SELECT ... FROM users ...') */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'users' };
