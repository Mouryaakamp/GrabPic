const { randomUUID } = require('crypto');
const { getPool } = require('../config/database');
const { generateJoinCode } = require('../utils/generateJoinCode');
const { DatabaseError } = require('../utils/error');

async function createEvent(organizerId, { name, description }) {

  const pool = getPool();
  const id = randomUUID();

  try {

    let join_code = generateJoinCode();

    let exists = await pool.query(
      'SELECT 1 FROM events WHERE join_code=$1',
      [join_code]
    );

    while (exists.rows.length > 0) {

      join_code = generateJoinCode();

      exists = await pool.query(
        'SELECT 1 FROM events WHERE join_code=$1',
        [join_code]
      );
    }

    await pool.query(
      `INSERT INTO events (id,name,description,organizer_id,join_code)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, name, description || null, organizerId, join_code]
    );

    const { rows } = await pool.query(
      `SELECT id,name,description,organizer_id,join_code,created_at
       FROM events WHERE id=$1`,
      [id]
    );

    return rows[0];

  } catch (err) {
    throw new DatabaseError('Failed to create event', err);
  }
}

async function listEventsByOrganizer(organizerId) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,name,description,organizer_id,join_code,created_at
     FROM events
     WHERE organizer_id=$1
     ORDER BY created_at DESC`,
    [organizerId]
  );

  return rows;
}

async function getEventById(eventId) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,name,description,organizer_id,join_code,created_at
     FROM events WHERE id=$1`,
    [eventId]
  );

  return rows[0] || null;
}

async function updateEvent(eventId, organizerId, { name, description }) {

  const pool = getPool();

  const { rowCount } = await pool.query(
    `UPDATE events
     SET name=COALESCE($2,name),
         description=COALESCE($3,description)
     WHERE id=$1 AND organizer_id=$4`,
    [eventId, name ?? null, description ?? null, organizerId]
  );

  if (rowCount === 0) return null;

  return getEventById(eventId);
}

async function findEventByJoinCode(joinCode) {

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,name,description,join_code
     FROM events WHERE join_code=$1`,
    [joinCode]
  );

  return rows[0] || null;
}

async function addMember(eventId, userId) {

  const pool = getPool();

  const id = randomUUID();

  await pool.query(
    `INSERT INTO event_members (id,event_id,user_id)
     VALUES ($1,$2,$3)
     ON CONFLICT (event_id,user_id) DO NOTHING`,
    [id, eventId, userId]
  );

  const { rows } = await pool.query(
    `SELECT 1 FROM event_members
     WHERE event_id=$1 AND user_id=$2`,
    [eventId, userId]
  );

  return rows.length > 0;
}

module.exports = {
  createEvent,
  listEventsByOrganizer,
  getEventById,
  updateEvent,
  findEventByJoinCode,
  addMember
};