import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@/components/Auth';
import { useBusiness } from '@/contexts/BusinessContext';
import { ThemeProvider } from '@/hooks/useTheme';

const LoginContent: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useBusiness();

  const handleLogin = (username: string) => {
    dispatch({ type: 'SET_USERNAME', payload: username });
    navigate('/dashboard');
  };

  return <Auth onLogin={handleLogin} />;
};

const LoginPage: React.FC = () => {
  return (
    <ThemeProvider>
      <LoginContent />
    </ThemeProvider>
  );
};

export default LoginPage;
