const photoController = require('../../controllers/photoController');
const { requireOrganizerAndEventOwnership } = require('../../middleware/authMiddleware');

exports.handler = async (event) => {
  const eventId = event.pathParameters?.eventId;
  const photoId = event.pathParameters?.photoId;

  const auth = await requireOrganizerAndEventOwnership(event, eventId);
  if (auth.error) return auth.error;

  return photoController.deletePhoto({ eventId, photoId });
};
