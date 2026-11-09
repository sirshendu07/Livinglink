import React from 'react';

const statusStyles = {
  // Access Status
  GREEN: 'bg-status-success/15 text-status-success border-status-success/30',
  RED: 'bg-status-danger/15 text-status-danger border-status-danger/30',

  // Generic
  ACTIVE: 'bg-status-success/15 text-status-success border-status-success/30',
  APPROVED: 'bg-status-success/15 text-status-success border-status-success/30',
  RESOLVED: 'bg-status-success/15 text-status-success border-status-success/30',
  PAID: 'bg-status-success/15 text-status-success border-status-success/30',

  PENDING: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  PENDING_APPROVAL: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  UNDER_REVIEW: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  ACKNOWLEDGED: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  UNPAID: 'bg-status-warning/15 text-status-warning border-status-warning/30',

  REJECTED: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  OVERDUE: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  SUSPENDED: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  DEACTIVATED: 'bg-status-danger/15 text-status-danger border-status-danger/30',
  URGENT: 'bg-status-danger/20 text-status-danger border-status-danger/40 animate-pulse',

  IMPORTANT: 'bg-accent/15 text-accent border-accent/30',
  GENERAL: 'bg-bg-elevated text-text-secondary border-border-muted',
  ENTERED: 'bg-status-info/15 text-status-info border-status-info/30',
  EXITED: 'bg-bg-elevated text-text-secondary border-border-muted',
  IN_PROGRESS: 'bg-status-info/15 text-status-info border-status-info/30'
};

export const Badge = ({ status = 'GENERAL', children, className = '' }) => {
  const normalizedKey = status?.toUpperCase() || 'GENERAL';
  const style = statusStyles[normalizedKey] || 'bg-bg-elevated text-text-secondary border-border-muted';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
