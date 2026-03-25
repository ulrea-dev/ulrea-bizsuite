import React from 'react';
import { WorkOSHub } from './WorkOSHub';

interface DashboardHomeProps {
  onShowBusinessSetup: () => void;
  onSelectBusiness: (businessId: string) => void;
  onCreateBusiness: () => void;
  onNavigateToProject: (projectId: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = () => {
  return <WorkOSHub />;
};
