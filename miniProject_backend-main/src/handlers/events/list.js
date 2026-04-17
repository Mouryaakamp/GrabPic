const { requireOrganizer } = require('../../middleware/authMiddleware');
const eventController = require('../../controllers/eventController');

exports.handler = async (event) => {

  const auth = await requireOrganizer(event);

  if (auth.error) return auth.error;

  return eventController.listEvents({
    organizerId: auth.user.sub
  });

};