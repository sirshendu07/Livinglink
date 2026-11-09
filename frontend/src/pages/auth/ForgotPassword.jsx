import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import { authApi } from '../../services/api/authApi';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase()
});

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      toast.success('If an account exists, a reset code was sent.');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card">
      <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center mb-4">
        <KeyRound className="w-6 h-6" />
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Forgot Password?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Enter your registered society email. We will send you an OTP to reset your credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" loading={loading} className="w-full">
          Send Reset OTP
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-border-muted/80 text-center">
        <Link to="/login" className="text-xs text-accent font-semibold hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
