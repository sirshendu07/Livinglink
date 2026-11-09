import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Shield,
  UserPlus,
  Clock,
  LogIn,
  QrCode,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MobileNav from '../components/layout/MobileNav';

const securityNavLinks = [
  { label: 'Gate Overview', to: '/security', icon: Shield, end: true },
  { label: 'New Visitor', to: '/security/new-visitor', icon: UserPlus },
  { label: 'Approvals', to: '/security/approvals', icon: Clock },
  { label: 'Inside Visitors', to: '/security/active-visitors', icon: LogIn },
  { label: 'Verify Card', to: '/security/verify-amenity', icon: QrCode },
  { label: 'SOS Alerts', to: '/security/sos', icon: ShieldAlert },
  { label: 'Society Feed', to: '/security/feed', icon: MessageSquare }
];

export const SecurityLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090C0F] flex">
      <Sidebar
        links={securityNavLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title="Gate Operations Desk" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <MobileNav links={securityNavLinks} />
      </div>
    </div>
  );
};

export default SecurityLayout;
