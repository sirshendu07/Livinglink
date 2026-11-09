const logger = require('../config/logger');
const env = require('../config/env');
const AppError = require('../utils/appError');

/**
 * Handle Mongoose CastError (e.g. invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return AppError.badRequest(message);
};

/**
 * Handle Mongoose Duplicate Key Error (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const message = `Duplicate value for '${field}'. Please use another value.`;
  return AppError.conflict(message);
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return AppError.badRequest(message);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => AppError.unauthorized('Invalid authentication token. Please log in again.');
const handleJWTExpiredError = () => AppError.unauthorized('Your authentication token has expired. Please log in again.');

/**
 * Global centralized error middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error using structured logger
  logger.error({
    err: {
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode: error.statusCode
    },
    url: req.originalUrl,
    method: req.method
  });

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const isOperational = error.isOperational || false;
  const statusCode = error.statusCode || 500;
  const message = isOperational ? error.message : 'Something went wrong on the server';

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.details ? { errors: error.details } : {}),
    ...(env.NODE_ENV === 'development' && !isOperational ? { stack: err.stack } : {})
  });
};

module.exports = errorHandler;
