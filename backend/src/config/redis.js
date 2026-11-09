const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback map for temporary cache when Redis is unavailable
const memoryFallback = new Map();
const memoryExpiry = new Map();

const isTlsUrl = (url) => typeof url === 'string' && url.startsWith('rediss://');

const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) {
          logger.warn('Redis reconnection limit reached. Operating in degraded fallback mode.');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      lazyConnect: true
    };

    if (isTlsUrl(env.REDIS_URL)) {
      redisOptions.tls = {
        rejectUnauthorized: false
      };
    }

    redisClient = new Redis(env.REDIS_URL, redisOptions);

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      // Do not log connection string or credentials
      logger.warn({ message: err.message }, 'Redis connection warning (operating with resilience)');
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    // Attempt initial connect asynchronously
    redisClient.connect().catch((err) => {
      logger.warn({ message: err.message }, 'Initial Redis connect attempt deferred (fallback active)');
    });

    return redisClient;
  } catch (error) {
    logger.warn({ message: error.message }, 'Failed to initialize Redis client. Fallback cache will be used.');
    return null;
  }
};

/**
 * Cache abstraction with safe in-memory fallback
 */
const cacheService = {
  getClient: () => redisClient,
  isConnected: () => isRedisConnected,

  async get(key) {
    if (isRedisConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis get error, falling back to memory');
      }
    }
    // Fallback
    const exp = memoryExpiry.get(key);
    if (exp && exp < Date.now()) {
      memoryFallback.delete(key);
      memoryExpiry.delete(key);
      return null;
    }
    const memVal = memoryFallback.get(key);
    return memVal !== undefined ? JSON.parse(memVal) : null;
  },

  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    if (isRedisConnected && redisClient) {
      try {
        if (ttlSeconds) {
          await redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, serialized);
        }
        return true;
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis set error, saving to memory fallback');
      }
    }
    memoryFallback.set(key, serialized);
    if (ttlSeconds) {
      memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
    return true;
  },

  async del(key) {
    if (isRedisConnected && redisClient) {
      try {
        await redisClient.del(key);
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis del error');
      }
    }
    memoryFallback.delete(key);
    memoryExpiry.delete(key);
    return true;
  },

  async delPattern(pattern) {
    if (isRedisConnected && redisClient) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } catch (err) {
        logger.warn({ pattern, err: err.message }, 'Redis delPattern error');
      }
    }
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of memoryFallback.keys()) {
      if (regex.test(key)) {
        memoryFallback.delete(key);
        memoryExpiry.delete(key);
      }
    }
    return true;
  },

  async exists(key) {
    if (isRedisConnected && redisClient) {
      try {
        const res = await redisClient.exists(key);
        return res === 1;
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis exists error');
      }
    }
    const exp = memoryExpiry.get(key);
    if (exp && exp < Date.now()) {
      memoryFallback.delete(key);
      memoryExpiry.delete(key);
      return false;
    }
    return memoryFallback.has(key);
  },

  async disconnect() {
    if (redisClient && isRedisConnected) {
      try {
        await redisClient.quit();
        isRedisConnected = false;
        logger.info('Redis disconnected cleanly');
      } catch (err) {
        logger.warn({ err: err.message }, 'Error disconnecting Redis');
      }
    }
  }
};

module.exports = {
  initRedis,
  cacheService
};
