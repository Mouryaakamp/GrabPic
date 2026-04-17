/**
 * Auth helpers for Lambda handlers: parse JWT from event, enforce role/membership.
 * Authorization header: "Bearer <token>"
 */

const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');
const { JWT_ACCESS_SECRET, USER_ROLES, HTTP_STATUS } = require('../config/constants');
const { errorResponse } = require('../utils/response');

function getTokenFromEvent(event) {
  const auth = event.headers?.Authorization || event.headers?.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function parseAuth(event) {
  const token = getTokenFromEvent(event);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    return { sub: payload.sub, role: payload.role, events: payload.events || [] };
  } catch {
    return null;
  }
}

async function requireOrganizer(event) {
  const user = parseAuth(event);
  if (!user) return { error: errorResponse(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', 'Missing or invalid token') };
  if (user.role !== USER_ROLES.ORGANIZER) {
    return { error: errorResponse(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Organizer role required') };
  }
  return { user };
}

async function requireAttendeeMember(event, eventId) {
  const user = parseAuth(event);
  if (!user) return { error: errorResponse(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', 'Missing or invalid token') };
  if (user.role !== USER_ROLES.ATTENDEE) {
    return { error: errorResponse(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Attendee role required') };
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT 1 FROM event_members WHERE event_id = $1 AND user_id = $2',
    [eventId, user.sub]
  );
  if (rows.length === 0) {
    return { error: errorResponse(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', 'Not a member of this event') };
  }
  return { user };
}

async function requireOrganizerAndEventOwnership(event, eventId) {
  const out = await requireOrganizer(event);
  if (out.error) return out;
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM events WHERE id = $1 AND organizer_id = $2',
    [eventId, out.user.sub]
  );
  if (rows.length === 0) {
    return {
      error: errorResponse(
        HTTP_STATUS.NOT_FOUND,
        'NOT_FOUND',
        'Event not found or access denied'
      ),
    };
  }
  return { user: out.user };
}

module.exports = {
  parseAuth,
  getTokenFromEvent,
  requireOrganizer,
  requireAttendeeMember,
  requireOrganizerAndEventOwnership,
};
