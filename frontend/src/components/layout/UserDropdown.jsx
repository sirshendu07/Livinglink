import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User as UserIcon, Building2, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';

export const UserDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-elevated transition-colors border border-transparent hover:border-border-muted"
      >
        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-bold text-xs">
          {user.name?.charAt(0) || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[120px]">
            {user.name}
          </p>
          <span className="text-[10px] text-text-secondary font-medium">
            {user.role === ROLES.OWNER && user.flat
              ? `${user.flat.tower}-${user.flat.flatNumber}`
              : user.role}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-bg-card border border-border-muted shadow-card py-2 z-50">
          <div className="px-4 py-2.5 border-b border-border-muted">
            <p className="text-xs font-semibold text-text-primary">{user.name}</p>
            <p className="text-[11px] text-text-secondary truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded border border-accent/30">
                {user.role}
              </span>
              {user.flat && (
                <span className="text-[10px] text-text-secondary flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-text-secondary" />
                  {user.flat.tower} • {user.flat.flatNumber}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-status-danger hover:bg-status-danger/10 transition-colors text-left font-medium mt-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
