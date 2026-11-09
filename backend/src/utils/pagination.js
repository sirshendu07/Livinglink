/**
 * Parse and normalize pagination parameters from request query
 */
const getPagination = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = {
  getPagination
};
