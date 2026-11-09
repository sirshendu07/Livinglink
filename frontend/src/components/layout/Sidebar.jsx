import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ links = [], isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0B0D10]/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-bg-sidebar border-r border-border-muted flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-muted flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-text-primary tracking-tight block">LivingLink</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-medium">
                Residential OS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent font-semibold border-l-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Role Badge */}
        {user && (
          <div className="p-4 border-t border-border-muted bg-[#0B0E12] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-primary truncate max-w-[140px]">{user.name}</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider">{user.role}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-status-success ring-4 ring-status-success/20" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
