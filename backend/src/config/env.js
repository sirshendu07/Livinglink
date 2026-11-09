const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/livinglink',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev_jwt_access_secret_super_key_32chars_long_minimum!',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_super_key_32chars_long_minimum!',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"LivingLink Society" <no-reply@livinglink.local>',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL
      ].filter(Boolean),

  PAYMENT_DEMO_SECRET: process.env.PAYMENT_DEMO_SECRET || 'LivingLinkDemoPay2026!',
  DEMO_PAYMENTS_ENABLED: process.env.DEMO_PAYMENTS_ENABLED === 'true',

  ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@livinglink.society',
  ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'AdminSecurePass#2026',
  ADMIN_BOOTSTRAP_NAME: process.env.ADMIN_BOOTSTRAP_NAME || 'LivingLink Super Admin',
  ADMIN_BOOTSTRAP_PHONE: process.env.ADMIN_BOOTSTRAP_PHONE || '+919876543210',

  CLOUDINARY_ENABLED: process.env.CLOUDINARY_ENABLED === 'true',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET || process.env.JWT_ACCESS_SECRET || 'livinglink_qr_signing_key_secret_2026'
};

// Safe warning for demo payments in production environments
if (env.NODE_ENV === 'production' && env.DEMO_PAYMENTS_ENABLED) {
  console.warn('[NOTICE] DEMO_PAYMENTS_ENABLED is active in production mode for demonstration/interview evaluation.');
}

module.exports = env;
