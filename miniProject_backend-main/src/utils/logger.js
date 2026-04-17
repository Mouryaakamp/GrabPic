/**
 * Minimal logger utility.
 * In production you can replace this with Winston, Pino, etc.
 */

const info = (message, meta) => {
  // eslint-disable-next-line no-console
  console.log('[INFO]', message, meta || '');
};

const warn = (message, meta) => {
  // eslint-disable-next-line no-console
  console.warn('[WARN]', message, meta || '');
};

const error = (message, err, meta) => {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', message, meta || '', err || '');
};

module.exports = {
  info,
  warn,
  error,
};

