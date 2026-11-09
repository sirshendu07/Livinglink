const crypto = require('crypto');
const env = require('../config/env');
const AppError = require('./appError');

/**
 * Generate a signed, tamper-resistant QR token for amenity access.
 * Contains minimal identifier and HMAC signature.
 */
const generateQrToken = ({ subscriptionId, userId, amenityId }) => {
  const payload = {
    subId: subscriptionId.toString(),
    uid: userId.toString(),
    aid: amenityId.toString(),
    iat: Math.floor(Date.now() / 1000)
  };

  const payloadString = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.QR_SIGNING_SECRET)
    .update(payloadString)
    .digest('base64url');

  return `${payloadString}.${signature}`;
};

/**
 * Verify and decode QR access token
 */
const verifyQrToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw AppError.badRequest('Invalid QR token format');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw AppError.badRequest('Malformed QR token');
  }

  const [payloadString, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', env.QR_SIGNING_SECRET)
    .update(payloadString)
    .digest('base64url');

  if (signature !== expectedSignature) {
    throw AppError.unauthorized('Tampered or invalid QR verification signature');
  }

  try {
    const jsonStr = Buffer.from(payloadString, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);
    return payload;
  } catch {
    throw AppError.badRequest('Invalid payload in QR token');
  }
};

module.exports = {
  generateQrToken,
  verifyQrToken
};
