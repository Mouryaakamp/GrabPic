const eventController = require('../../controllers/eventController');
const { parseAuth } = require('../../middleware/authMiddleware');

function parseBody(event){
  try{ return JSON.parse(event.body); }
  catch{ return {}; }
}

exports.handler = async (event) => {

  const body = parseBody(event);

  const currentUser = parseAuth(event);

  return eventController.joinEvent({
    join_code: body.join_code,
    currentUser
  });

};