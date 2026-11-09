import React from 'react';
import { NavLink } from 'react-router-dom';

export const MobileNav = ({ links = [] }) => {
  // Take top 4-5 key links for bottom bar
  const mainLinks = links.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-bg-sidebar/95 backdrop-blur-md border-t border-border-muted flex items-center justify-around px-2">
      {mainLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span className="truncate max-w-[50px]">{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
