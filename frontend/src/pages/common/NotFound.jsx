import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main text-center">
      <div className="max-w-md bg-bg-card border border-border-muted rounded-2xl p-8 shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto mb-4 font-mono font-bold text-2xl">
          404
        </div>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Page Not Found</h2>
        <p className="text-xs text-text-secondary mt-1.5 mb-6">
          The requested page does not exist or has been moved to another location.
        </p>
        <Link to="/">
          <Button icon={Home} className="w-full">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const Forbidden = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main text-center">
      <div className="max-w-md bg-bg-card border border-border-muted rounded-2xl p-8 shadow-card">
        <div className="w-16 h-16 rounded-2xl bg-status-danger/15 border border-status-danger/30 text-status-danger flex items-center justify-center mx-auto mb-4 font-mono font-bold text-2xl">
          403
        </div>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">Access Restricted</h2>
        <p className="text-xs text-text-secondary mt-1.5 mb-6">
          You do not have administrative permissions to view this resource.
        </p>
        <Link to="/">
          <Button icon={Home} className="w-full">
            Return to Authorized Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
