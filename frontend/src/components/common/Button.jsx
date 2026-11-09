import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-accent text-[#0B0D10] font-semibold hover:bg-accent-hover shadow-glow',
  secondary: 'bg-bg-elevated text-text-primary hover:bg-[#232B35] border border-border-muted',
  danger: 'bg-status-danger/15 text-status-danger hover:bg-status-danger/25 border border-status-danger/30',
  outline: 'bg-transparent text-text-primary hover:bg-bg-card border border-border-muted',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base'
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
