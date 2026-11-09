import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building,
  Bell,
  MessageSquare,
  Receipt,
  Dumbbell,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  FileText
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MobileNav from '../components/layout/MobileNav';

const adminNavLinks = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Residents', to: '/admin/residents', icon: Users },
  { label: 'Flats & Towers', to: '/admin/flats', icon: Building },
  { label: 'Notices', to: '/admin/notices', icon: Bell },
  { label: 'Society Feed', to: '/admin/feed', icon: MessageSquare },
  { label: 'Maintenance', to: '/admin/maintenance', icon: Receipt },
  { label: 'Amenities', to: '/admin/amenities', icon: Dumbbell },
  { label: 'Complaints', to: '/admin/complaints', icon: AlertCircle },
  { label: 'Gate Visitors', to: '/admin/visitors', icon: ShieldCheck },
  { label: 'SOS Monitoring', to: '/admin/sos', icon: ShieldAlert },
  { label: 'Staff Accounts', to: '/admin/staff', icon: UserCheck },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: FileText }
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main flex">
      <Sidebar
        links={adminNavLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Committee Administration" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <MobileNav links={adminNavLinks} />
      </div>
    </div>
  );
};

export default AdminLayout;
