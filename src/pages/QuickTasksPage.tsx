import React from 'react';
import { QuickTasksPage as QuickTasksPageComponent } from '@/components/QuickTasksPage';

const QuickTasksPage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Quick Tasks</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage quick tasks and one-off jobs
        </p>
      </div>
      <QuickTasksPageComponent />
    </div>
  );
};

export default QuickTasksPage;
