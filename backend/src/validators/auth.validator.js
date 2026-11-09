const { z } = require('zod');
const { ROLES } = require('../constants/roles');

const registerOwnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email is required').toLowerCase(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  tower: z.string().min(1, 'Tower identifier is required').trim(),
  flatNumber: z.string().min(1, 'Flat number is required').trim()
});

const verifyOtpSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET']).default('REGISTRATION')
});

const resendOtpSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET']).default('REGISTRATION')
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase()
});

const resetPasswordSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email is required').toLowerCase(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([ROLES.ADMIN, ROLES.SECURITY])
});

module.exports = {
  registerOwnerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema
};
