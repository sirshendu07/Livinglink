import React from 'react';
import OwnerFeed from '../owner/OwnerFeed';

export default function SecurityFeed() {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Society Community Channel
        </h1>
        <p className="text-text-secondary text-sm">
          Guard house updates, package arrival notes, and neighborhood alerts.
        </p>
      </div>
      <OwnerFeed />
    </div>
  );
}
