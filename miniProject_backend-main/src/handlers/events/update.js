const { requireOrganizerAndEventOwnership } = require('../../middleware/authMiddleware');
const eventController = require('../../controllers/eventController');

function parseBody(event){
  try{ return JSON.parse(event.body); }
  catch{ return {}; }
}

exports.handler = async (event) => {

  const eventId = event.pathParameters?.eventId;

  const auth =
    await requireOrganizerAndEventOwnership(event, eventId);

  if (auth.error) return auth.error;

  const body = parseBody(event);

  return eventController.updateEvent({
    eventId,
    organizerId: auth.user.sub,
    name: body.name,
    description: body.description
  });

};