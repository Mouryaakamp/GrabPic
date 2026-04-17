const photoController = require('../../controllers/photoController');
const { requireAttendeeMember } = require('../../middleware/authMiddleware');

exports.handler = async (event) => {

  const eventId = event.pathParameters?.eventId;
  const photoId = event.pathParameters?.photoId;

  const auth = await requireAttendeeMember(event, eventId);

  if (auth.error) return auth.error;

  return photoController.getDownloadUrl({
    eventId,
    photoId
  });
};