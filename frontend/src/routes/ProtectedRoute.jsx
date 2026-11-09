import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { USER_STATUS } from '../constants';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <Loader message="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Handle account status flags
  if (user.status === USER_STATUS.PENDING_APPROVAL) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
    return <Navigate to="/account-suspended" replace />;
  }

  // Handle role restrictions
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
