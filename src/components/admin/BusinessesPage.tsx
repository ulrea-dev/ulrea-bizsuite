import React, { useState } from 'react';
import { BusinessManagement } from '@/components/BusinessManagement';
import { BusinessSetup } from '@/components/BusinessSetup';

export const BusinessesPage: React.FC = () => {
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);

  const handleCreateBusiness = () => {
    setShowBusinessSetup(true);
  };

  const handleBusinessSetupComplete = () => {
    setShowBusinessSetup(false);
  };

  if (showBusinessSetup) {
    return (
      <div className="space-y-6">
        <BusinessSetup onComplete={handleBusinessSetupComplete} />
      </div>
    );
  }

  return <BusinessManagement onCreateBusiness={handleCreateBusiness} />;
};
