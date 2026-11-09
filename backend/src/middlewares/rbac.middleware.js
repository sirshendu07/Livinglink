const AppError = require('../utils/appError');
const { AUTH } = require('../constants/messages');

/**
 * Restrict endpoint access to specific roles
 * @param  {...string} roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized(AUTH.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
