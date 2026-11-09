const pino = require('pino');
const env = require('./env');

const redactionPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'password',
  'req.body.password',
  'body.password',
  'otp',
  'req.body.otp',
  'body.otp',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'paymentPassphrase',
  'req.body.paymentPassphrase'
];

let logger;

try {
  logger = pino({
    level: env.LOG_LEVEL || 'info',
    redact: {
      paths: redactionPaths,
      censor: '[REDACTED]'
    },
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname'
            }
          }
        : undefined
  });
} catch {
  // Fallback in case pino-pretty isn't available
  logger = pino({
    level: env.LOG_LEVEL || 'info',
    redact: {
      paths: redactionPaths,
      censor: '[REDACTED]'
    }
  });
}

module.exports = logger;
