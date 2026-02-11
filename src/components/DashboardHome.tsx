import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { BusinessSetup } from './BusinessSetup';
import { WorkOSHub } from './WorkOSHub';

interface DashboardHomeProps {
  onShowBusinessSetup: () => void;
  onSelectBusiness: (businessId: string) => void;
  onCreateBusiness: () => void;
  onNavigateToProject: (projectId: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  onShowBusinessSetup, 
}) => {
  const { data, currentBusiness } = useBusiness();

  if (!currentBusiness && data.businesses.length === 0) {
    return <BusinessSetup onComplete={onShowBusinessSetup} />;
  }

  return <WorkOSHub />;
};
