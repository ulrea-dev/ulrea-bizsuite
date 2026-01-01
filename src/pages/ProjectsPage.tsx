import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectsPage as ProjectsPageComponent } from '@/components/ProjectsPage';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToPage = (page: string, itemId?: string) => {
    if (page === 'projects' && itemId) {
      navigate(`/projects/${itemId}`);
    } else {
      navigate(`/${page}`);
    }
  };

  return <ProjectsPageComponent onNavigateToPage={handleNavigateToPage} />;
};

export default ProjectsPage;
