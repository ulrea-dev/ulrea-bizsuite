import React from 'react';
import { QuickTaskPaymentsPage } from '@/components/QuickTaskPaymentsPage';

const TaskPaymentsPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Task Payments</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage payments for quick tasks
        </p>
      </div>
      <QuickTaskPaymentsPage />
    </div>
  );
};

export default TaskPaymentsPage;
