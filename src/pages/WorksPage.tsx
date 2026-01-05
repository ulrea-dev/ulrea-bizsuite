import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorksPage as WorksPageComponent } from '@/components/WorksPage';

const WorksPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToPage = (page: string, itemId?: string) => {
    if (page === 'works' && itemId) {
      navigate(`/works/${itemId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <WorksPageComponent onNavigateToPage={handleNavigateToPage} />;
};

export default WorksPage;
