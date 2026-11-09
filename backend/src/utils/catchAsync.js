/**
 * Wraps async Express handlers to catch unhandled rejections and pass to next()
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
