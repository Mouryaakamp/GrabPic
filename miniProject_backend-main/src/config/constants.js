/**
 * App constants: roles, statuses, HTTP codes, JWT, S3, Redis, and feature flags.
 */

module.exports = {
  // User roles (matches DB and JWT)
  USER_ROLES: {
    ORGANIZER: 'organizer',
    ATTENDEE: 'attendee',
  },

  // User status (for future use, e.g. blocking)
  USER_STATUS: {
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    INACTIVE: 'inactive',
  },

  // Photo processing status (matches photos.processing_status)
  PHOTO_PROCESSING_STATUS: {
    PENDING: 'pending',
    PROCESSED: 'processed',
    FAILED: 'failed',
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'change-me-access',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'change-me-refresh',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Guest user (synthetic attendee from join code)
  GUEST_EMAIL_PREFIX: 'guest+',
  GUEST_EMAIL_DOMAIN: '@guest.yourapp.com',

  // S3
  S3_BUCKET: process.env.S3_BUCKET || '',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  PRESIGN_EXPIRES_IN: 3600,

  // Redis & BullMQ
  REDIS_URL: process.env.REDIS_URL || 'redis://redis:6379',
  QUEUE_NAME: 'face-processing',

  // ML embedding service (for face search)
  ML_EMBEDDING_URL: process.env.ML_EMBEDDING_URL || 'http://localhost:8001',
};
