import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHome } from '@/components/DashboardHome';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleShowBusinessSetup = () => {
    console.log('Business setup triggered');
  };

  const handleSelectBusiness = (businessId: string) => {
    console.log('Business selected:', businessId);
  };

  const handleCreateBusiness = () => {
    console.log('Create business triggered');
  };

  const handleNavigateToProject = (projectId: string) => {
    navigate(`/works/projects/${projectId}`);
  };

  return (
    <DashboardHome
      onShowBusinessSetup={handleShowBusinessSetup}
      onSelectBusiness={handleSelectBusiness}
      onCreateBusiness={handleCreateBusiness}
      onNavigateToProject={handleNavigateToProject}
    />
  );
};

export default DashboardPage;
