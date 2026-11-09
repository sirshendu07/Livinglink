const { verifyAccessToken } = require('../utils/jwt.utils');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { USER_STATUS } = require('../constants/statuses');

/**
 * Protect routes - Authenticate JWT access token from Bearer header or cookie
 */
const authenticate = catchAsync(async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(AppError.unauthorized('Authentication required. Please login with a valid access token.'));
  }

  const decoded = verifyAccessToken(token);

  const currentUser = await User.findById(decoded.id).populate('flat');
  if (!currentUser) {
    return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
  }

  if (currentUser.status === USER_STATUS.SUSPENDED) {
    return next(AppError.forbidden('Your account is currently suspended. Please contact society administration.'));
  }

  if (currentUser.status === USER_STATUS.DEACTIVATED) {
    return next(AppError.forbidden('Your account has been deactivated.'));
  }

  req.user = currentUser;
  next();
});

module.exports = {
  authenticate
};
