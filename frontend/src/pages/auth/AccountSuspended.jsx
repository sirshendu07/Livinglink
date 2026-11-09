import React from 'react';
import { AlertOctagon, PhoneCall, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const AccountSuspended = () => {
  const { logout } = useAuth();

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-status-danger/15 border border-status-danger/30 text-status-danger flex items-center justify-center mx-auto mb-5">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Account Suspended</h2>
      
      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
        Your society account has been placed on administrative hold by the society committee. Access to portal features, amenity passes, and feed has been temporarily restricted.
      </p>

      <div className="my-6 p-4 rounded-xl bg-bg-elevated border border-border-muted text-left space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-primary">
          <PhoneCall className="w-4 h-4 text-accent flex-shrink-0" />
          <span>Contact Society Administration Office</span>
        </div>
        <p className="text-[11px] text-text-secondary pl-6">
          Please reach out to the management committee desk or visit the society estate office to resolve any pending account flags.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={logout}
        icon={LogOut}
        className="w-full text-xs"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default AccountSuspended;
