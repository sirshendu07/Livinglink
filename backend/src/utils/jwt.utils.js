const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const AppError = require('./appError');

/**
 * Generate Access Token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.access.secret, {
    expiresIn: jwtConfig.access.expiresIn
  });
};

/**
 * Generate Refresh Token with unique JTI to guarantee rotation uniqueness
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomBytes(16).toString('hex')
    },
    jwtConfig.refresh.secret,
    {
      expiresIn: jwtConfig.refresh.expiresIn
    }
  );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.access.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token has expired. Please refresh your session.');
    }
    throw AppError.unauthorized('Invalid access token');
  }
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refresh.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Refresh token has expired. Please login again.');
    }
    throw AppError.unauthorized('Invalid refresh token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
