const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash password using bcrypt with random salt
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password against bcrypt hash
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Hash token using SHA-256 for secure database storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate cryptographically secure random string
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken
};
