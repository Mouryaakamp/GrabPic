const authService = require('../services/authService');
const { success, error } = require('../utils/response');

async function register(input) {

  try {

    const data = await authService.register(input);

    return success({
      statusCode: 201,
      message: 'User registered successfully',
      data
    });

  } catch (err) {

    return error({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      error: err
    });

  }
}

async function login(input) {

  try {

    const data = await authService.login(input);

    return success({
      message: 'Login successful',
      data
    });

  } catch (err) {

    return error({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      error: err
    });

  }
}

async function refresh(input) {

  try {

    const data = await authService.refresh(input.refresh_token);

    return success({
      message: 'Token refreshed',
      data
    });

  } catch (err) {

    return error({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      error: err
    });

  }
}

/* ----------- GUEST USER ENDPOINT ----------- */

async function guest(_input) {

  try {

    const user = await authService.createGuestUser();

    const tokens = authService.tokensForUser(user);

    return success({
      message: 'Guest user created',
      data: tokens
    });

  } catch (err) {

    return error({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      error: err
    });

  }
}

module.exports = {
  register,
  login,
  refresh,
  guest
};