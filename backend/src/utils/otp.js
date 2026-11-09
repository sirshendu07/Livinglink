const crypto = require('crypto');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');
const AppError = require('./appError');
const { hashToken } = require('./crypto.utils');

/**
 * Generate cryptographically secure 6-digit numeric OTP
 */
const generateSecureOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Save OTP to Redis with TTL, attempt tracking and cooldown
 */
const storeOtp = async (identifier, purpose = 'REGISTRATION') => {
  const cooldownKey = `${CACHE_KEYS.OTP_COOLDOWN_PREFIX}${purpose}:${identifier}`;
  if (process.env.NODE_ENV !== 'test') {
    const isCooldown = await cacheService.exists(cooldownKey);
    if (isCooldown) {
      throw AppError.badRequest('Please wait 60 seconds before requesting another OTP.');
    }
  }

  const rawOtp = generateSecureOtp();
  const hashedOtp = hashToken(rawOtp);
  const otpKey = `${CACHE_KEYS.OTP_PREFIX}${purpose}:${identifier}`;
  const attemptsKey = `${CACHE_KEYS.OTP_ATTEMPTS_PREFIX}${purpose}:${identifier}`;

  // Store hashed OTP for 5 minutes
  await cacheService.set(otpKey, hashedOtp, CACHE_TTL.OTP);
  // Reset attempt count for 5 minutes
  await cacheService.set(attemptsKey, 0, CACHE_TTL.OTP);
  // Set cooldown for 60 seconds
  await cacheService.set(cooldownKey, '1', CACHE_TTL.OTP_COOLDOWN);

  return rawOtp;
};

/**
 * Verify OTP from Redis with max attempts check
 */
const verifyOtp = async (identifier, candidateOtp, purpose = 'REGISTRATION') => {
  const otpKey = `${CACHE_KEYS.OTP_PREFIX}${purpose}:${identifier}`;
  const attemptsKey = `${CACHE_KEYS.OTP_ATTEMPTS_PREFIX}${purpose}:${identifier}`;

  const storedHashedOtp = await cacheService.get(otpKey);
  if (!storedHashedOtp) {
    throw AppError.badRequest('OTP expired or not found. Please request a new OTP.');
  }

  const attempts = (await cacheService.get(attemptsKey)) || 0;
  if (attempts >= 5) {
    await cacheService.del(otpKey);
    await cacheService.del(attemptsKey);
    throw AppError.badRequest('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  // Increment attempts
  await cacheService.set(attemptsKey, attempts + 1, CACHE_TTL.OTP);

  const candidateHash = hashToken(candidateOtp.trim());
  if (candidateHash !== storedHashedOtp) {
    throw AppError.badRequest(`Invalid OTP. ${4 - attempts} attempts remaining.`);
  }

  // OTP verified successfully - clear from Redis
  await cacheService.del(otpKey);
  await cacheService.del(attemptsKey);
  return true;
};

module.exports = {
  generateSecureOtp,
  storeOtp,
  verifyOtp
};
