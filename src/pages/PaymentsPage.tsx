import React from 'react';
import { PaymentsPage as PaymentsPageComponent } from '@/components/PaymentsPage';

const PaymentsPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage all payment records
        </p>
      </div>
      <PaymentsPageComponent />
    </div>
  );
};

export default PaymentsPage;
