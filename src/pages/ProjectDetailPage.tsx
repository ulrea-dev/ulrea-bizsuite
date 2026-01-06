import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectDetailPage as ProjectDetailComponent } from '@/components/ProjectDetailPage';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  if (!projectId) {
    navigate('/works/projects');
    return null;
  }

  return (
    <ProjectDetailComponent 
      projectId={projectId}
      onBack={() => navigate('/works/projects')}
    />
  );
};

export default ProjectDetailPage;
