const { requireOrganizer } = require('../../middleware/authMiddleware');
const eventController = require('../../controllers/eventController');

function parseBody(event) {
  try { return JSON.parse(event.body); }
  catch { return {}; }
}

exports.handler = async (event) => {

  const auth = await requireOrganizer(event);

  if (auth.error) return auth.error;

  const body = parseBody(event);

  return eventController.createEvent({
    organizerId: auth.user.sub,
    name: body.name,
    description: body.description
  });

};