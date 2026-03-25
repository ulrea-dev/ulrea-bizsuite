import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@/components/Auth';
import { useBusiness } from '@/contexts/BusinessContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const LoginContent: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useBusiness();
  const [isChecking, setIsChecking] = useState(true);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setIsChecking(false);
      }
    });
  }, [navigate]);

  const handleLogin = (userId: string, email: string) => {
    // Update userSettings with the Supabase user id for cloud storage keying
    dispatch({ type: 'SET_USER_ID', payload: userId });
    navigate('/dashboard');
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
