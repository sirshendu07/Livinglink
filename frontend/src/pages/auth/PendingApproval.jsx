import React from 'react';
import { Clock, CheckCircle2, ShieldCheck, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const PendingApproval = () => {
  const { logout, user } = useAuth();

  return (
    <div className="bg-bg-card border border-border-muted rounded-2xl p-6 sm:p-8 shadow-card text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-status-warning/15 border border-status-warning/30 text-status-warning flex items-center justify-center mx-auto mb-5">
        <Clock className="w-7 h-7" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Account Awaiting Approval</h2>
      
      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
        Your email is verified! As a society security measure, all flat owner accounts must be reviewed and authorized by the society management committee before access is granted.
      </p>

      <div className="my-6 p-4 rounded-xl bg-bg-elevated border border-border-muted text-left space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-text-primary">
          <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
          <span>Email verification completed</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-status-warning">
          <Clock className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>Committee membership review pending</span>
        </div>
        {user?.flat && (
          <div className="pt-2 border-t border-border-muted/60 text-[11px] text-text-secondary">
            Registered Flat: <span className="text-text-primary font-semibold">{user.flat.tower} • Flat {user.flat.flatNumber}</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-secondary mb-6">
        You will receive an automated email notification as soon as your committee admin approves your account.
      </p>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={logout}
          icon={LogOut}
          className="w-full text-xs"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;
