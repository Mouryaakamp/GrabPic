const searchController = require('../../controllers/searchController');
const { requireAttendeeMember } = require('../../middleware/authMiddleware');

function getBodyJson(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (err) {
    return {};
  }
}

exports.handler = async (event) => {

  const eventId = event.pathParameters?.eventId;

  const auth =
    await requireAttendeeMember(event, eventId);

  if (auth.error) return auth.error;

  const body = getBodyJson(event);
  const imageBase64 = body.image;

  const limit =
    event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;

  return searchController.searchFaces({
    eventId,
    userId: auth.user.sub,
    imageBase64,
    limit
  });
};