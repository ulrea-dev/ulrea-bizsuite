import React from 'react';
import { SalariesPage as SalariesPageComponent } from '@/components/SalariesPage';

const SalariesPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage salaries and payroll
        </p>
      </div>
      <SalariesPageComponent />
    </div>
  );
};

export default SalariesPage;
