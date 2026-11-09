/**
 * Redis Cache Key namespaces, keys, and default TTLs.
 */
module.exports = {
  CACHE_KEYS: {
    NOTICES_PUBLISHED: 'notices:published',
    AMENITIES_CATALOG: 'amenities:catalog',
    DASHBOARD_STATS: 'analytics:dashboard',
    FEED_RECENT: 'feed:recent',
    OTP_PREFIX: 'otp:',
    OTP_ATTEMPTS_PREFIX: 'otp:attempts:',
    OTP_COOLDOWN_PREFIX: 'otp:cooldown:',
    RATE_LIMIT_AUTH_PREFIX: 'rl:auth:',
    RATE_LIMIT_FEED_PREFIX: 'rl:feed:',
    SOS_COOLDOWN_PREFIX: 'sos:cooldown:'
  },
  CACHE_TTL: {
    NOTICES: 600, // 10 minutes
    AMENITIES: 1800, // 30 minutes
    DASHBOARD: 300, // 5 minutes
    FEED: 120, // 2 minutes
    OTP: 300, // 5 minutes (standard requirement)
    OTP_COOLDOWN: 60, // 60 seconds resend cooldown
    SOS_COOLDOWN: 10 // 10 seconds duplicate trigger protection
  }
};
