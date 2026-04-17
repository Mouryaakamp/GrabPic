const authController = require('../../controllers/authController');

function parseBody(event) {

  if (!event.body) return {};

  try {
    return typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;
  } catch {
    return {};
  }
}

exports.handler = async (event) => {

  const body = parseBody(event);

  return authController.register(body);
};