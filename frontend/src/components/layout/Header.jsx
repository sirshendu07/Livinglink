import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserDropdown from './UserDropdown';
import SosButton from '../ui/SosButton';
import { notificationApi } from '../../services/api/userApi';
import { formatTimeAgo } from '../../utils/formatters';

export const Header = ({ onMenuClick, title }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications({ limit: 10 });
      setNotifications(data?.items || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch {
      // Ignore
    }
  };

  const handleToggleNotifications = () => {
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg-main/90 backdrop-blur-md border-b border-border-muted px-4 sm:px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {title ? (
            <h1 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{title}</h1>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Welcome back,</span>
              <span className="text-xs font-semibold text-text-primary">{user?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Accessible Emergency Action */}
        <SosButton />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger ring-2 ring-bg-main" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-bg-card border border-border-muted rounded-xl shadow-card p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border-muted mb-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-accent hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-6">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        n.isRead ? 'bg-bg-elevated/40 border-border-muted/50 text-text-secondary' : 'bg-bg-elevated border-accent/30 text-text-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-text-primary">{n.title}</span>
                        <span className="text-[10px] text-text-secondary">{formatTimeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default Header;
