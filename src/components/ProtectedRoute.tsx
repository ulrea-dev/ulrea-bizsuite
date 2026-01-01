import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';

export const ProtectedRoute: React.FC = () => {
  const { data } = useBusiness();
  const isAuthenticated = !!data.userSettings.username;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
