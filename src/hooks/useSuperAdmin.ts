import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseSuperAdminResult {
  user: User | null;
  isAuthorized: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useSuperAdmin(): UseSuperAdminResult {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/super-admin', { replace: true });
        return;
      }

      const { data: adminRow } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        navigate('/super-admin', { replace: true });
        return;
      }

      setUser(session.user);
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/super-admin', { replace: true });
  };

  return { user, isAuthorized, isLoading, signOut };
}
