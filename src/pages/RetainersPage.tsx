import React from 'react';
import { RetainersPage as RetainersPageComponent } from '@/components/RetainersPage';

const RetainersPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Retainers</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage recurring retainer agreements
        </p>
      </div>
      <RetainersPageComponent isEmbedded />
    </div>
  );
};

export default RetainersPage;
