import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Building, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/forms/Input';
import Button from '../../components/common/Button';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Must contain at least 1 number'),
  tower: z.string().min(1, 'Tower identifier is required (e.g. Tower A)'),
  flatNumber: z.string().min(1, 'Flat number is required (e.g. 101)')
});

export const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Registration initiated! Verification OTP sent to your email.');
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Resident Registration</h2>
        <p className="text-xs text-text-secondary mt-1">
          Register your flat ownership. Membership is activated upon admin committee approval.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full Name"
          placeholder="e.g. Priya Sharma"
          icon={User}
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Email Address"
            type="email"
            placeholder="priya@example.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+919876543210"
            icon={Phone}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Tower"
            placeholder="e.g. Tower A"
            icon={Building}
            error={errors.tower?.message}
            {...register('tower')}
          />
          <Input
            label="Flat Number"
            placeholder="e.g. 402"
            icon={Home}
            error={errors.flatNumber?.message}
            {...register('flatNumber')}
          />
        </div>

        <Input
          label="Password"
          type="password"
          placeholder="Min 8 characters (uppercase & number)"
          icon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" loading={loading} className="w-full mt-3">
          Create Owner Account
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-border-muted/80 text-center">
        <p className="text-xs text-text-secondary">
          Already registered?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
