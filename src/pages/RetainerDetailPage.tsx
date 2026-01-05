import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RetainerDetailPage as RetainerDetailComponent } from '@/components/RetainerDetailPage';

const RetainerDetailPage: React.FC = () => {
  const { retainerId } = useParams<{ retainerId: string }>();
  const navigate = useNavigate();

  if (!retainerId) {
    navigate('/works?tab=retainers');
    return null;
  }

  return (
    <RetainerDetailComponent 
      retainerId={retainerId}
      onBack={() => navigate('/works?tab=retainers')}
    />
  );
};

export default RetainerDetailPage;
