import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Dumbbell,
  Receipt,
  AlertCircle,
  Users
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MobileNav from '../components/layout/MobileNav';

const ownerNavLinks = [
  { label: 'Overview', to: '/owner', icon: LayoutDashboard, end: true },
  { label: 'Notices', to: '/owner/notices', icon: Bell },
  { label: 'Society Feed', to: '/owner/feed', icon: MessageSquare },
  { label: 'Amenities', to: '/owner/amenities', icon: Dumbbell },
  { label: 'Maintenance', to: '/owner/maintenance', icon: Receipt },
  { label: 'Complaints', to: '/owner/complaints', icon: AlertCircle },
  { label: 'Visitors', to: '/owner/visitors', icon: Users }
];

export const OwnerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main flex">
      {/* Desktop / Collapsible Sidebar */}
      <Sidebar
        links={ownerNavLinks}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav links={ownerNavLinks} />
      </div>
    </div>
  );
};

export default OwnerLayout;
