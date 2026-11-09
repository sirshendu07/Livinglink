import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-accent animate-spin`} />
      {message && <p className="text-xs text-text-secondary font-medium tracking-wide">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0D10]/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="py-8 flex justify-center">{content}</div>;
};

export default Loader;
