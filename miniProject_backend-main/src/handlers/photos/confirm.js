const photoController = require('../../controllers/photoController');
const { requireOrganizerAndEventOwnership } = require('../../middleware/authMiddleware');

function parseBody(e){
  try { return JSON.parse(e.body); }
  catch { return {}; }
}

exports.handler = async (event) => {

  const eventId = event.pathParameters?.eventId;

  const auth = await requireOrganizerAndEventOwnership(event, eventId);

  if (auth.error) return auth.error;

  const body = parseBody(event);

  return photoController.confirmUpload({
    eventId,
    photo_id: body.photo_id,
    storage_key: body.storage_key
  });
};