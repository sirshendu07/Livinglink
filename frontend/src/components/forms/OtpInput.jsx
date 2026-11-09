import React, { useRef, useState, useEffect } from 'react';
import Button from '../common/Button';

export const OtpInput = ({ length = 6, onComplete, onResend, loading = false, error = '' }) => {
  const [digits, setDigits] = useState(new Array(length).fill(''));
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    // Auto focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newDigits.every((d) => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pasted)) return;

    const chars = pasted.slice(0, length).split('');
    const newDigits = [...digits];
    chars.forEach((c, idx) => {
      newDigits[idx] = c;
    });
    setDigits(newDigits);

    if (newDigits.every((d) => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  const handleResendClick = () => {
    if (cooldown === 0 && onResend) {
      setCooldown(60);
      onResend();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2.5 sm:gap-3 justify-center mb-3" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-bg-card border ${
              error ? 'border-status-danger' : 'border-border-muted focus:border-accent'
            } rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all`}
          />
        ))}
      </div>

      {error && <p className="text-xs text-status-danger mb-3">{error}</p>}

      <div className="flex items-center justify-between w-full text-xs text-text-secondary mt-2">
        <span>Didn't receive the email code?</span>
        {cooldown > 0 ? (
          <span className="text-text-secondary font-medium">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={loading}
            className="text-accent hover:underline font-semibold"
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
};

export default OtpInput;
