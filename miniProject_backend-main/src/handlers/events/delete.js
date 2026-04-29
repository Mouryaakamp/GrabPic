const eventController = require('../../controllers/eventController');
const { requireOrganizer } = require('../../middleware/authMiddleware');

exports.handler = async (event) => {
  const eventId = event.pathParameters?.eventId;

  const auth = await requireOrganizer(event);
  if (auth.error) return auth.error;

  const organizerId = auth.user.id;

  return eventController.deleteEvent({ eventId, organizerId });
};
