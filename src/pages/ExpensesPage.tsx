import React from 'react';
import { ExpensesPage as ExpensesPageComponent } from '@/components/ExpensesPage';

const ExpensesPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track and manage business expenses
        </p>
      </div>
      <ExpensesPageComponent />
    </div>
  );
};

export default ExpensesPage;
