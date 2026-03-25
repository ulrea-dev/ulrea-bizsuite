import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

const SuperAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in as super admin, redirect
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase
          .from('super_admins')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (data) navigate('/super-admin/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      // Check super_admins table
      const { data: adminRow } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        setError('Unauthorized. This account does not have super admin access.');
        return;
      }

      navigate('/super-admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">WorkOS Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Super Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          WorkOS by Ulrea · Super Admin Access Only
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;
