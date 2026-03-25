import React from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { LegacyOnboardingFlow } from './LegacyOnboardingFlow';
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
  const { data, currentBusiness, isLoadingFromDB } = useBusiness();

  // While DB is loading, don't flash the onboarding flow
  if (isLoadingFromDB) return null;

  if (!currentBusiness && data.businesses.length === 0) {
    return <LegacyOnboardingFlow onComplete={onShowBusinessSetup} />;
  }

  return <WorkOSHub />;
};
