
import React, { useState, useEffect } from 'react';
import { Auth } from '@/components/Auth';
import { Dashboard } from '@/components/Dashboard';
import { ThemeProvider } from '@/hooks/useTheme';
import { BusinessProvider, useBusiness } from '@/contexts/BusinessContext';

const AppContent: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    if (data.userSettings.username) {
      setIsAuthenticated(true);
    }
  }, [data.userSettings.username]);

  const handleLogin = (username: string) => {
    dispatch({ type: 'SET_USERNAME', payload: username });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Note: We don't clear the username so they can return easily
  };

  const handleCreateBusiness = () => {
    // This could be enhanced for business creation functionality
    console.log('Create business triggered');
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} onCreateBusiness={handleCreateBusiness} />;
};

const Index: React.FC = () => {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <AppContent />
      </BusinessProvider>
    </ThemeProvider>
  );
};

export default Index;
