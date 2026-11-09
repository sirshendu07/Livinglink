const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const jwtConfig = require('../config/jwt');

const register = catchAsync(async (req, res) => {
  const result = await authService.registerOwner(req.body);
  return ApiResponse.created(res, result.message, { userId: result.userId, email: result.email });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await authService.verifyUserOtp(req.body);
  return ApiResponse.success(res, result.message);
});

const resendOtp = catchAsync(async (req, res) => {
  const result = await authService.resendUserOtp(req.body);
  return ApiResponse.success(res, result.message);
});

const login = catchAsync(async (req, res) => {
  const device = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress;

  const { user, accessToken, refreshToken } = await authService.loginUser({
    ...req.body,
    device,
    ipAddress
  });

  // Set HttpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, jwtConfig.cookie);

  return ApiResponse.success(res, 'Login successful', {
    user,
    accessToken,
    refreshToken // Also return in body for mobile/API clients
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  const device = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress;

  const result = await authService.rotateTokens({
    refreshToken: token,
    device,
    ipAddress
  });

  res.cookie('refreshToken', result.refreshToken, jwtConfig.cookie);

  return ApiResponse.success(res, 'Token refreshed successfully', {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
});

const logout = catchAsync(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  await authService.logoutSession(token);

  res.clearCookie('refreshToken', jwtConfig.cookie);
  return ApiResponse.success(res, 'Logged out successfully');
});

const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAllSessions(req.user._id);

  res.clearCookie('refreshToken', jwtConfig.cookie);
  return ApiResponse.success(res, 'Logged out from all devices successfully');
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return ApiResponse.success(res, result.message);
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.clearCookie('refreshToken', jwtConfig.cookie);
  return ApiResponse.success(res, result.message);
});

const getMe = catchAsync(async (req, res) => {
  return ApiResponse.success(res, 'Current profile retrieved', { user: req.user });
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe
};
