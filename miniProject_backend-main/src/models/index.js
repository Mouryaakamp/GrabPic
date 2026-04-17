/** DB pool and table names. Example: const { getPool } = require('../models'); const r = await getPool().query('SELECT * FROM users WHERE id = $1', [id]); */

const { getPool } = require('../config/database');
module.exports = { getPool };
