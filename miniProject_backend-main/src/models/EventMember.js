/** Event members table (event_members). Use getPool() and pool.query(...) */

const { getPool } = require('../config/database');
module.exports = { getPool, table: 'event_members' };
