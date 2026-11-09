const User = require('../models/user.model');
const Flat = require('../models/flat.model');
const RefreshSession = require('../models/refreshSession.model');
const { storeOtp, verifyOtp } = require('../utils/otp');
const { sendMail } = require('../config/email');
const { hashPassword, hashToken } = require('../utils/crypto.utils');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt.utils');
const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/statuses');
const { AUTH } = require('../constants/messages');
const logger = require('../config/logger');

/**
 * Register a new society owner
 */
const registerOwner = async ({ name, email, phone, password, tower, flatNumber }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('An account with this email already exists.');
  }

  // Find or create the Flat record
  const normalizedTower = tower.trim().toUpperCase();
  const normalizedFlatNumber = flatNumber.trim().toUpperCase();

  let flat = await Flat.findOne({
    tower: normalizedTower,
    flatNumber: normalizedFlatNumber
  });

  if (!flat) {
    flat = await Flat.create({
      tower: normalizedTower,
      flatNumber: normalizedFlatNumber,
      residents: []
    });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: ROLES.OWNER,
    flat: flat._id,
    isEmailVerified: false,
    status: USER_STATUS.PENDING_APPROVAL
  });

  // Attach resident to flat
  flat.residents.push(newUser._id);
  await flat.save();

  // Generate & Dispatch OTP
  const rawOtp = await storeOtp(newUser.email, 'REGISTRATION');
  try {
    await sendMail({
      to: newUser.email,
      subject: 'LivingLink — Email Verification OTP',
      text: `Welcome to LivingLink! Your email verification OTP is ${rawOtp}. It will expire in 5 minutes.`,
      html: `<h2>Welcome to LivingLink</h2><p>Your email verification OTP is: <strong>${rawOtp}</strong></p><p>This OTP will expire in 5 minutes.</p>`
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to send registration OTP email');
  }

  return {
    userId: newUser._id,
    email: newUser.email,
    message: AUTH.REGISTER_SUCCESS
  };
};

/**
 * Verify Registration or Password-Reset OTP
 */
const verifyUserOtp = async ({ email, otp, purpose = 'REGISTRATION' }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw AppError.notFound('User with this email not found.');
  }

  await verifyOtp(user.email, otp, purpose);

  if (purpose === 'REGISTRATION') {
    user.isEmailVerified = true;
    await user.save();
    return {
      success: true,
      message: AUTH.OTP_VERIFIED
    };
  }

  return {
    success: true,
    message: 'OTP verified successfully. You may now reset your password.'
  };
};

/**
 * Resend OTP
 */
const resendUserOtp = async ({ email, purpose = 'REGISTRATION' }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw AppError.notFound('User with this email not found.');
  }

  const rawOtp = await storeOtp(user.email, purpose);
  await sendMail({
    to: user.email,
    subject: `LivingLink — Your OTP for ${purpose.replace('_', ' ')}`,
    text: `Your OTP is ${rawOtp}. Valid for 5 minutes.`,
    html: `<p>Your OTP is: <strong>${rawOtp}</strong>. Valid for 5 minutes.</p>`
  });

  return { message: AUTH.OTP_SENT };
};

/**
 * User Login with Refresh Token Rotation
 */
const loginUser = async ({ email, password, device = 'Unknown Device', ipAddress = null }) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('flat');

  if (!user || !(await user.matchPassword(password))) {
    throw AppError.unauthorized(AUTH.LOGIN_INVALID);
  }

  if (!user.isEmailVerified) {
    throw AppError.badRequest('Please verify your email before logging in. An OTP was sent during registration.');
  }

  if (user.status === USER_STATUS.PENDING_APPROVAL) {
    throw AppError.forbidden(AUTH.LOGIN_PENDING_APPROVAL);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw AppError.forbidden(AUTH.LOGIN_SUSPENDED);
  }

  if (user.status === USER_STATUS.DEACTIVATED) {
    throw AppError.forbidden('Your account has been deactivated.');
  }

  // Issue Tokens
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  const tokenHash = hashToken(refreshToken);

  // Store refresh session (7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshSession.create({
    user: user._id,
    tokenHash,
    device,
    ipAddress,
    expiresAt
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      flat: user.flat
    },
    accessToken,
    refreshToken
  };
};

/**
 * Refresh Access Token with Token Rotation & Reuse Detection
 */
const rotateTokens = async ({ refreshToken, device = 'Unknown Device', ipAddress = null }) => {
  if (!refreshToken) {
    throw AppError.unauthorized('Refresh token is required');
  }

  const decoded = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const existingSession = await RefreshSession.findOne({ tokenHash });

  // REUSE DETECTION: If token not found or already revoked, potential token theft!
  if (!existingSession || existingSession.isRevoked) {
    // Revoke all sessions for this compromised user
    await RefreshSession.updateMany({ user: decoded.id }, { isRevoked: true });
    logger.warn({ userId: decoded.id }, 'CRITICAL: Refresh token reuse detected! All user sessions revoked.');
    throw AppError.unauthorized(AUTH.REFRESH_REUSE_DETECTED);
  }

  // Revoke the current used token
  existingSession.isRevoked = true;
  await existingSession.save();

  const user = await User.findById(decoded.id).populate('flat');
  if (!user || user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
    throw AppError.unauthorized('User is no longer active');
  }

  // Issue new pair of tokens (Rotation)
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);
  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshSession.create({
    user: user._id,
    tokenHash: newTokenHash,
    device,
    ipAddress,
    expiresAt
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      flat: user.flat
    }
  };
};

/**
 * Logout single session
 */
const logoutSession = async (refreshToken) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshSession.findOneAndUpdate({ tokenHash }, { isRevoked: true });
  }
  return { message: AUTH.LOGOUT_SUCCESS };
};

/**
 * Logout all active sessions for a user
 */
const logoutAllSessions = async (userId) => {
  await RefreshSession.updateMany({ user: userId }, { isRevoked: true });
  return { message: AUTH.LOGOUT_ALL_SUCCESS };
};

/**
 * Forgot password - initiates OTP
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return standard message to prevent email enumeration
    return { message: 'If an account exists with that email, a password reset OTP has been sent.' };
  }

  const rawOtp = await storeOtp(user.email, 'PASSWORD_RESET');
  await sendMail({
    to: user.email,
    subject: 'LivingLink — Password Reset OTP',
    text: `Your password reset OTP is ${rawOtp}. Valid for 5 minutes.`,
    html: `<p>Your password reset OTP is: <strong>${rawOtp}</strong>. Valid for 5 minutes.</p>`
  });

  return { message: 'If an account exists with that email, a password reset OTP has been sent.' };
};

/**
 * Reset password using OTP
 */
const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw AppError.notFound('User with this email not found.');
  }

  await verifyOtp(user.email, otp, 'PASSWORD_RESET');

  user.password = await hashPassword(newPassword);
  await user.save();

  // Revoke all sessions for security
  await RefreshSession.updateMany({ user: user._id }, { isRevoked: true });

  return { message: 'Password has been reset successfully. You may now login.' };
};

module.exports = {
  registerOwner,
  verifyUserOtp,
  resendUserOtp,
  loginUser,
  rotateTokens,
  logoutSession,
  logoutAllSessions,
  forgotPassword,
  resetPassword
};
