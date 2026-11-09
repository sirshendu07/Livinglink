import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, USER_STATUS } from '../constants';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import OwnerLayout from '../layouts/OwnerLayout';
import AdminLayout from '../layouts/AdminLayout';
import SecurityLayout from '../layouts/SecurityLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PendingApproval from '../pages/auth/PendingApproval';
import AccountSuspended from '../pages/auth/AccountSuspended';

// Common Pages
import NotFound from '../pages/common/NotFound';
import Forbidden from '../pages/common/Forbidden';

// Owner Pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import OwnerNotices from '../pages/owner/OwnerNotices';
import OwnerFeed from '../pages/owner/OwnerFeed';
import OwnerAmenities from '../pages/owner/OwnerAmenities';
import OwnerMaintenance from '../pages/owner/OwnerMaintenance';
import OwnerComplaints from '../pages/owner/OwnerComplaints';
import OwnerVisitors from '../pages/owner/OwnerVisitors';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminResidents from '../pages/admin/AdminResidents';
import AdminDefaulters from '../pages/admin/AdminDefaulters';
import AdminFlats from '../pages/admin/AdminFlats';
import AdminNotices from '../pages/admin/AdminNotices';
import AdminMaintenance from '../pages/admin/AdminMaintenance';
import AdminAmenities from '../pages/admin/AdminAmenities';
import AdminComplaints from '../pages/admin/AdminComplaints';
import AdminVisitors from '../pages/admin/AdminVisitors';
import AdminSos from '../pages/admin/AdminSos';
import AdminStaff from '../pages/admin/AdminStaff';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

// Security Pages
import SecurityDashboard from '../pages/security/SecurityDashboard';
import NewVisitor from '../pages/security/NewVisitor';
import VisitorApprovals from '../pages/security/VisitorApprovals';
import ActiveVisitors from '../pages/security/ActiveVisitors';
import VerifyAmenity from '../pages/security/VerifyAmenity';
import SecuritySos from '../pages/security/SecuritySos';
import SecurityFeed from '../pages/security/SecurityFeed';

// Root Redirect Helper
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (user.status === USER_STATUS.PENDING_APPROVAL) {
    return <Navigate to="/pending-approval" replace />;
  }
  if (user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
    return <Navigate to="/account-suspended" replace />;
  }

  if (user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === ROLES.SECURITY) return <Navigate to="/security" replace />;
  return <Navigate to="/owner" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Status-specific screens */}
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/account-suspended" element={<AccountSuspended />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Owner Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.OWNER]} />}>
        <Route element={<OwnerLayout />}>
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/notices" element={<OwnerNotices />} />
          <Route path="/owner/feed" element={<OwnerFeed />} />
          <Route path="/owner/amenities" element={<OwnerAmenities />} />
          <Route path="/owner/maintenance" element={<OwnerMaintenance />} />
          <Route path="/owner/complaints" element={<OwnerComplaints />} />
          <Route path="/owner/visitors" element={<OwnerVisitors />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/residents" element={<AdminResidents />} />
          <Route path="/admin/defaulters" element={<AdminDefaulters />} />
          <Route path="/admin/flats" element={<AdminFlats />} />
          <Route path="/admin/notices" element={<AdminNotices />} />
          <Route path="/admin/feed" element={<OwnerFeed />} />
          <Route path="/admin/maintenance" element={<AdminMaintenance />} />
          <Route path="/admin/amenities" element={<AdminAmenities />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/visitors" element={<AdminVisitors />} />
          <Route path="/admin/sos" element={<AdminSos />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Route>

      {/* Security Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.SECURITY, ROLES.ADMIN]} />}>
        <Route element={<SecurityLayout />}>
          <Route path="/security" element={<SecurityDashboard />} />
          <Route path="/security/new-visitor" element={<NewVisitor />} />
          <Route path="/security/approvals" element={<VisitorApprovals />} />
          <Route path="/security/active-visitors" element={<ActiveVisitors />} />
          <Route path="/security/verify-amenity" element={<VerifyAmenity />} />
          <Route path="/security/sos" element={<SecuritySos />} />
          <Route path="/security/feed" element={<SecurityFeed />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
