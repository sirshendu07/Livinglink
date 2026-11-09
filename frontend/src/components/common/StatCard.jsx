import React from 'react';
import Card from './Card';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, className = '' }) => {
  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-bg-elevated border border-border-muted text-accent">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h4>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={`text-xs font-medium ${
                  trend > 0 ? 'text-status-success' : trend < 0 ? 'text-status-danger' : 'text-text-secondary'
                }`}
              >
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            {subtitle && <span className="text-xs text-text-secondary">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
