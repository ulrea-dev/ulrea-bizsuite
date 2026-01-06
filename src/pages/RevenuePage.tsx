import React from 'react';
import { RevenuePage as RevenuePageComponent } from '@/components/RevenuePage';

const RevenuePage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track and analyze your revenue streams
        </p>
      </div>
      <RevenuePageComponent />
    </div>
  );
};

export default RevenuePage;
