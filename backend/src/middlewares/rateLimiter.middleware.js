const { cacheService } = require('../config/redis');
const AppError = require('../utils/appError');

/**
 * Reusable Redis/Memory Sliding-Window Rate Limiter Middleware
 *
 * @param {string} prefix Key prefix for rate limiting
 * @param {number} maxRequests Maximum requests allowed within window
 * @param {number} windowSeconds Time window in seconds
 */
const rateLimit = (prefix = 'rl', maxRequests = 60, windowSeconds = 60) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const identifier = req.user ? req.user._id.toString() : ip;
      const key = `${prefix}:${identifier}`;

      const current = (await cacheService.get(key)) || 0;

      if (current >= maxRequests) {
        return next(
          AppError.tooManyRequests(
            `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowSeconds} seconds.`
          )
        );
      }

      await cacheService.set(key, current + 1, windowSeconds);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - (current + 1)));

      next();
    } catch {
      // Never block legitimate traffic due to rate limiting errors
      next();
    }
  };
};

module.exports = {
  rateLimit
};
