import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';
import { ROLES, USER_STATUS } from '../../constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data);
      toast.success(`Welcome back, ${user.name}!`);

      if (user.status === USER_STATUS.PENDING_APPROVAL) {
        navigate('/pending-approval');
        return;
      }

      if (user.status === USER_STATUS.SUSPENDED) {
        navigate('/account-suspended');
        return;
      }

      // Navigate by role
      if (user.role === ROLES.ADMIN) {
        navigate('/admin');
      } else if (user.role === ROLES.SECURITY) {
        navigate('/security');
      } else {
        navigate('/owner');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      if (errorMsg.toLowerCase().includes('pending admin approval')) {
        navigate('/pending-approval');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Sign in to LivingLink</h2>
        <p className="text-xs text-text-secondary mt-1">
          Access your residential portal, gate passes, and committee services.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-text-secondary hover:text-text-primary"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input type="checkbox" className="rounded bg-bg-elevated border-border-muted text-accent focus:ring-accent" />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-accent hover:underline font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border-muted/80 text-center">
        <p className="text-xs text-text-secondary">
          New flat owner?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Register your flat membership
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
