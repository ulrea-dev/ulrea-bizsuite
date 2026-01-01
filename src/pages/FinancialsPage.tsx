import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialsPage as FinancialsPageComponent } from '@/components/FinancialsPage';

const FinancialsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (page: string, itemId?: string) => {
    if (page === 'retainer-detail' && itemId) {
      navigate(`/financials/retainers/${itemId}`);
    }
  };

  return <FinancialsPageComponent onNavigate={handleNavigate} />;
};

export default FinancialsPage;
