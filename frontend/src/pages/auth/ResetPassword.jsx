import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import { authApi } from '../../services/api/authApi';

const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Must contain at least 1 number')
});

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetSchema)
  });

  const onSubmit = async (data) => {
    if (!email) {
      toast.error('Missing email parameter. Please initiate forgot password again.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card">
      <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center mb-4">
        <ShieldCheck className="w-6 h-6" />
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Create New Password</h2>
        <p className="text-xs text-text-secondary mt-1">
          Enter the 6-digit OTP sent to <span className="font-semibold text-text-primary">{email || 'your email'}</span> and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="6-Digit Reset OTP"
          placeholder="e.g. 123456"
          maxLength={6}
          error={errors.otp?.message}
          {...register('otp')}
        />

        <Input
          label="New Password"
          type="password"
          placeholder="Min 8 characters (uppercase & number)"
          icon={Lock}
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <Button type="submit" loading={loading} className="w-full">
          Update Password
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-border-muted/80 text-center">
        <Link to="/login" className="text-xs text-accent font-semibold hover:underline">
          Cancel and return to Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
