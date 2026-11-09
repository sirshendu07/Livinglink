import React from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NoticeBanner = ({ notice, linkTo = '/notices' }) => {
  if (!notice) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-status-danger/10 border border-status-danger/30 p-4 mb-6 shadow-alert">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-status-danger/20 text-status-danger flex-shrink-0 animate-pulse">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-status-danger uppercase tracking-wider bg-status-danger/20 px-2 py-0.5 rounded">
              Urgent Notice
            </span>
          </div>
          <h4 className="text-sm font-semibold text-text-primary mt-1 truncate">{notice.title}</h4>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{notice.content}</p>
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="flex items-center gap-1 text-xs font-semibold text-status-danger hover:text-status-danger/80 p-1 flex-shrink-0"
          >
            <span>Read</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default NoticeBanner;
