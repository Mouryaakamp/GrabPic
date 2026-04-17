const eventService = require('../services/eventService');
const authService = require('../services/authService');

const { success, error, validationError } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { getPool } = require('../config/database');

async function createEvent({ organizerId, name, description }) {

  if (!organizerId || !name) {
    return validationError(
      [{ field: 'organizerId/name', message: 'organizerId and name are required' }]
    );
  }

  try {

    const event = await eventService.createEvent(
      organizerId,
      { name, description }
    );

    return success({
      statusCode: HTTP_STATUS.CREATED,
      message: 'Event created successfully',
      data: { event }
    });

  } catch (err) {

    return error({
      statusCode: err.statusCode || 500,
      message: err.message,
      error: err
    });

  }
}

async function listEvents({ organizerId }) {

  if (!organizerId) {
    return validationError([
      { field: 'organizerId', message: 'organizerId is required' }
    ]);
  }

  try {

    const events =
      await eventService.listEventsByOrganizer(organizerId);

    return success({
      message: 'Events fetched successfully',
      data: { events }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to fetch events',
      error: err
    });

  }
}

async function getEvent({ eventId }) {

  if (!eventId) {
    return validationError([
      { field: 'eventId', message: 'eventId is required' }
    ]);
  }

  try {

    const event =
      await eventService.getEventById(eventId);

    if (!event) {

      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Event not found'
      });

    }

    return success({
      message: 'Event fetched successfully',
      data: { event }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to fetch event',
      error: err
    });

  }
}

async function updateEvent({ eventId, organizerId, name, description }) {

  if (!eventId || !organizerId) {

    return validationError([
      { field: 'eventId/organizerId', message: 'required' }
    ]);

  }

  try {

    const event =
      await eventService.updateEvent(
        eventId,
        organizerId,
        { name, description }
      );

    if (!event) {

      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Event not found'
      });

    }

    return success({
      message: 'Event updated successfully',
      data: { event }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to update event',
      error: err
    });

  }
}

async function joinEvent({ join_code, currentUser }) {

  if (!join_code) {

    return validationError([
      { field: 'join_code', message: 'join_code is required' }
    ]);

  }

  try {

    const event =
      await eventService.findEventByJoinCode(join_code);

    if (!event) {

      return error({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Invalid join code'
      });

    }

    let userId;
    let userInfo;

    if (currentUser && currentUser.role === USER_ROLES.ATTENDEE) {

      userId = currentUser.sub;

      const pool = getPool();

      const { rows } = await pool.query(
        'SELECT id,email,role FROM users WHERE id=$1',
        [userId]
      );

      if (rows[0]) {
        userInfo = rows[0];
      }

    }

    if (!userId) {

      userInfo = await authService.createGuestUser();
      userId = userInfo.id;

    }

    await eventService.addMember(event.id, userId);

    const tokens =
      authService.tokensForUser(userInfo, [event.id]);

    return success({
      message: 'Joined event successfully',
      data: {
        event,
        ...tokens
      }
    });

  } catch (err) {

    return error({
      statusCode: 500,
      message: 'Failed to join event',
      error: err
    });

  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  joinEvent
};