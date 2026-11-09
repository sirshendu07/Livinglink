const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Socket.IO authentication middleware.
 * Verifies JWT from handshake auth token or cookie before connection is established.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!token && socket.handshake.headers?.cookie) {
      const cookieMatch = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('_id name email role flat status');

    if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      return next(new Error('Authentication error: User inactive or unauthorized'));
    }

    socket.user = user;
    next();
  } catch (error) {
    logger.warn({ message: error.message }, 'Socket.IO handshake authentication failed');
    next(new Error('Authentication error: Invalid or expired token'));
  }
};

module.exports = socketAuthMiddleware;
