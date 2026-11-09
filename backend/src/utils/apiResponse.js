/**
 * Consistent API Response Formatter
 */
class ApiResponse {
  static success(res, message = 'Operation successful', data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res, message = 'Resource created successfully', data = {}) {
    return ApiResponse.success(res, message, data, 201);
  }

  static paginated(res, message = 'Data retrieved successfully', items = [], pagination = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: {
        items,
        pagination: {
          total: pagination.total || items.length,
          page: pagination.page || 1,
          limit: pagination.limit || items.length,
          totalPages: pagination.totalPages || 1,
          hasNextPage: pagination.page < pagination.totalPages,
          hasPrevPage: pagination.page > 1
        }
      }
    });
  }
}

module.exports = ApiResponse;
