/**
 * Standard API and domain messages.
 */
module.exports = {
  AUTH: {
    REGISTER_SUCCESS: 'Registration successful. Please verify the OTP sent to your email.',
    OTP_SENT: 'Verification OTP has been sent to your email.',
    OTP_VERIFIED: 'Email verified successfully. Account is awaiting admin approval.',
    OTP_INVALID_OR_EXPIRED: 'Invalid or expired OTP. Please request a new one.',
    OTP_COOLDOWN: 'Please wait before requesting another OTP.',
    OTP_MAX_ATTEMPTS: 'Maximum verification attempts exceeded. Please request a new OTP.',
    LOGIN_SUCCESS: 'Logged in successfully.',
    LOGIN_INVALID: 'Invalid email or password.',
    LOGIN_PENDING_APPROVAL: 'Your account is pending admin approval. You will be notified once approved.',
    LOGIN_SUSPENDED: 'Your account has been suspended. Please contact society administration.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully.',
    UNAUTHORIZED: 'Authentication required. Please provide a valid access token.',
    FORBIDDEN: 'Access forbidden. You do not have permission for this resource.',
    TOKEN_EXPIRED: 'Token expired. Please refresh your session.',
    REFRESH_SUCCESS: 'Token refreshed successfully.',
    REFRESH_REUSE_DETECTED: 'Security alert: Refresh token reuse detected. All sessions revoked.'
  },
  AMENITIES: {
    INELIGIBLE_MAINTENANCE: 'Access denied: Unpaid maintenance invoices pending. Please clear your dues.'
  }
};
