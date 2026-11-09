import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';

export default function Forbidden() {
  const { user } = useAuth();

  const getHomeRoute = () => {
    if (user?.role === ROLES.ADMIN) return '/admin';
    if (user?.role === ROLES.SECURITY) return '/security';
    return '/owner';
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-surface-card border border-border-muted shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
            403 - Access Prohibited
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Your current security credentials ({user?.role || 'Guest'}) do not possess authorization to enter this sector.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={getHomeRoute()}>
            <Button variant="primary" icon={<Home className="w-4 h-4" />}>
              Return to Safe Sector
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
