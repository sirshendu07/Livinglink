import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import OtpInput from '../../components/forms/OtpInput';
import { authApi } from '../../services/api/authApi';

export const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') || '';

  const [email] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (otp) => {
    if (!email) {
      toast.error('Missing email reference. Please register or login again.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.verifyOtp({
        email,
        otp,
        purpose: 'REGISTRATION'
      });
      toast.success('Email verified successfully! Awaiting committee approval.');
      navigate('/pending-approval');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendOtp({ email, purpose: 'REGISTRATION' });
      toast.success('New 6-digit verification code dispatched to your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card text-center">
      <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/40 text-accent flex items-center justify-center mx-auto mb-4">
        <MailCheck className="w-6 h-6" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Verify Your Email</h2>
      <p className="text-xs text-text-secondary mt-1.5 mb-6 max-w-sm mx-auto">
        We sent a 6-digit verification code to <span className="font-semibold text-text-primary">{email || 'your email'}</span>. Enter the code below.
      </p>

      <OtpInput
        onComplete={handleComplete}
        onResend={handleResend}
        loading={loading}
        error={error}
      />

      <div className="mt-8 pt-4 border-t border-border-muted/80 text-center">
        <Link to="/login" className="text-xs text-accent font-semibold hover:underline">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyOtp;
