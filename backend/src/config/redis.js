const { createClient } = require('redis');
const env = require('./env');
const logger = require('./logger');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback map for resilient caching when Redis is disconnected or during local tests
const memoryFallback = new Map();
const memoryExpiry = new Map();

/**
 * Checks if a connection string requests a secure TLS connection
 */
const isTlsUrl = (url) => typeof url === 'string' && url.startsWith('rediss://');

/**
 * Initialize Redis using the official node-redis package.
 * Provider-independent: works with Upstash, Redis Cloud, AWS ElastiCache, or local Redis.
 */
const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  // 1. Read REDIS_URL dynamically from environment (never hardcode credentials)
  const redisUrl = process.env.REDIS_URL || env.REDIS_URL || 'redis://localhost:6379';
  const hasTls = isTlsUrl(redisUrl);

  try {
    const socketOptions = {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.warn('Redis reconnection limit reached (10 attempts). Operating with fallback cache.');
          return new Error('Redis max reconnect attempts reached');
        }
        // Exponential backoff with a cap of 3 seconds
        return Math.min(retries * 150, 3000);
      }
    };

    // 4. Support TLS automatically when using rediss://
    if (hasTls) {
      socketOptions.tls = true;
      socketOptions.rejectUnauthorized = false; // Prevents strict CA validation failures on managed cloud providers
    }

    // 3. Use createClient({ url: process.env.REDIS_URL })
    redisClient = createClient({
      url: redisUrl,
      socket: socketOptions
    });

    // 5. Connection, Reconnection & Error handling
    redisClient.on('connect', () => {
      logger.info('Redis client socket connected');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      logger.info('Redis client ready to receive commands');
    });

    redisClient.on('reconnecting', () => {
      isRedisConnected = false;
      logger.warn('Redis client attempting reconnection...');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      // Never log sensitive credentials or connection URLs in error traces
      logger.warn({ message: err.message }, 'Redis connection warning (operating with resilience)');
    });

    redisClient.on('end', () => {
      isRedisConnected = false;
      logger.info('Redis connection closed');
    });

    // Asynchronously connect without blocking application boot
    redisClient.connect().catch((err) => {
      logger.warn({ message: err.message }, 'Initial Redis connect attempt deferred (fallback active)');
    });

    return redisClient;
  } catch (error) {
    logger.warn({ message: error.message }, 'Failed to initialize Redis client. Fallback cache active.');
    return null;
  }
};

/**
 * High-performance Cache Service with automatic in-memory fallback
 * Supporting Caching, Rate Limiting, OTP Expiration, and Temporary Data.
 */
const cacheService = {
  getClient: () => redisClient,
  isConnected: () => isRedisConnected && redisClient && redisClient.isOpen,

  /**
   * 9. Redis PING health check
   */
  async ping() {
    if (this.isConnected()) {
      try {
        const start = Date.now();
        const response = await redisClient.ping();
        const latencyMs = Date.now() - start;
        return {
          status: response === 'PONG' ? 'UP' : 'DEGRADED',
          response,
          latencyMs
        };
      } catch (err) {
        logger.warn({ message: err.message }, 'Redis PING failed');
        return { status: 'DOWN', error: err.message };
      }
    }
    return { status: 'DEGRADED_FALLBACK', message: 'Operating in memory cache mode' };
  },

  /**
   * 6. Caching & Temporary Data: Get cached item
   */
  async get(key) {
    if (this.isConnected()) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis get error, falling back to memory');
      }
    }

    // In-memory fallback
    const exp = memoryExpiry.get(key);
    if (exp && exp < Date.now()) {
      memoryFallback.delete(key);
      memoryExpiry.delete(key);
      return null;
    }
    const memVal = memoryFallback.get(key);
    return memVal !== undefined ? JSON.parse(memVal) : null;
  },

  /**
   * 6. Caching & Temporary Data: Store item with optional TTL (seconds)
   */
  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);

    if (this.isConnected()) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await redisClient.set(key, serialized, { EX: ttlSeconds });
        } else {
          await redisClient.set(key, serialized);
        }
        return true;
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis set error, saving to memory fallback');
      }
    }

    // In-memory fallback
    memoryFallback.set(key, serialized);
    if (ttlSeconds && ttlSeconds > 0) {
      memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
    return true;
  },

  /**
   * Rate limiting: increment counter
   */
  async incr(key) {
    if (this.isConnected()) {
      try {
        return await redisClient.incr(key);
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis incr error, falling back to memory');
      }
    }

    const current = (await this.get(key) || 0) + 1;
    await this.set(key, current);
    return current;
  },

  /**
   * Rate limiting & OTP: Set key expiration in seconds
   */
  async expire(key, seconds) {
    if (this.isConnected()) {
      try {
        return await redisClient.expire(key, seconds);
      } catch (err) {
        logger.warn({ key, err: err.message }, 'Redis expire error');
      }
    }

    if (memoryFallback.has(key)) {
      memoryExpiry.set(key, Date.now() + seconds * 1000);
      return true;
    }
    return false;
  },

  /**
   * Delete key
   */
  async del(key) {
    if (this.isConnected()) {
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

  /**
   * Delete keys matching a wildcard pattern (e.g. notices:*)
   */
  async delPattern(pattern) {
    if (this.isConnected()) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (err) {
        logger.warn({ pattern, err: err.message }, 'Redis delPattern error');
      }
    }

    // Memory fallback pattern cleanup
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of memoryFallback.keys()) {
      if (regex.test(key)) {
        memoryFallback.delete(key);
        memoryExpiry.delete(key);
      }
    }
    return true;
  },

  /**
   * Check key existence
   */
  async exists(key) {
    if (this.isConnected()) {
      try {
        const count = await redisClient.exists(key);
        return count > 0;
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

  /**
   * Cleanly disconnect Redis during server shutdown
   */
  async disconnect() {
    if (redisClient && redisClient.isOpen) {
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
