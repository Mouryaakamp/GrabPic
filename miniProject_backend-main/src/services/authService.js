const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { getPool } = require('../config/database');

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  USER_ROLES,
  GUEST_EMAIL_PREFIX,
  GUEST_EMAIL_DOMAIN
} = require('../config/constants');

const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  DatabaseError
} = require('../utils/error');

const SALT_ROUNDS = 10;

/* ---------------- TOKEN HELPERS ---------------- */

function signAccess(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

function signRefresh(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

function verifyRefresh(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

function tokensForUser(user, eventIds = []) {

  const access_token = signAccess({
    sub: user.id,
    role: user.role,
    ...(eventIds.length ? { events: eventIds } : {})
  });

  const refresh_token = signRefresh({ sub: user.id });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    access_token,
    refresh_token,
    token_type: 'Bearer'
  };
}

/* ---------------- REGISTER ---------------- */

async function register({ email, password, role }) {

  if (!email || !password || !role) {
    throw new BadRequestError('email, password and role are required');
  }

  if (![USER_ROLES.ORGANIZER, USER_ROLES.ATTENDEE].includes(role)) {
    throw new BadRequestError('role must be organizer or attendee');
  }

  const pool = getPool();
  const id = randomUUID();

  try {

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      `INSERT INTO users (id,email,password_hash,role)
       VALUES ($1,$2,$3,$4)`,
      [id, email, password_hash, role]
    );

    return tokensForUser({ id, email, role });

  } catch (err) {

    if (err.code === '23505') {
      throw new ConflictError('Email already exists');
    }

    throw new DatabaseError('Failed to register user', err);
  }
}

/* ---------------- LOGIN ---------------- */

async function login({ email, password }) {

  if (!email || !password) {
    throw new BadRequestError('email and password are required');
  }

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,email,role,password_hash
     FROM users WHERE email=$1`,
    [email]
  );

  if (rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  return tokensForUser(user);
}

/* ---------------- REFRESH TOKEN ---------------- */

async function refresh(refresh_token) {

  if (!refresh_token) {
    throw new BadRequestError('refresh_token is required');
  }

  let payload;

  try {
    payload = verifyRefresh(refresh_token);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT id,email,role FROM users WHERE id=$1`,
    [payload.sub]
  );

  if (rows.length === 0) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = rows[0];

  return {
    access_token: signAccess({
      sub: user.id,
      role: user.role
    }),
    token_type: 'Bearer'
  };
}

/* ---------------- CREATE GUEST USER ---------------- */

async function createGuestUser() {

  const pool = getPool();

  const id = randomUUID();

  const email =
    `${GUEST_EMAIL_PREFIX}${id}${GUEST_EMAIL_DOMAIN}`;

  const password_hash = await bcrypt.hash(randomUUID(), SALT_ROUNDS);

  await pool.query(
    `INSERT INTO users (id,email,password_hash,role)
     VALUES ($1,$2,$3,$4)`,
    [id, email, password_hash, USER_ROLES.ATTENDEE]
  );

  return {
    id,
    email,
    role: USER_ROLES.ATTENDEE
  };
}

module.exports = {
  register,
  login,
  refresh,
  createGuestUser,
  tokensForUser,
  signAccess
};