const { requireOrganizerAndEventOwnership } = require('../../middleware/authMiddleware');
const eventController = require('../../controllers/eventController');

exports.handler = async (event) => {

  const eventId = event.pathParameters?.eventId;

  const auth =
    await requireOrganizerAndEventOwnership(event, eventId);

  if (auth.error) return auth.error;

  return eventController.getEvent({ eventId });

};