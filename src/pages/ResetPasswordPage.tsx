import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { ThemeProvider } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, Moon, Sun, KeyRound } from 'lucide-react';

const ResetPasswordContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const isForced = searchParams.get('force') === '1';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Failed to set password', description: error.message, variant: 'destructive' });
        return;
      }

      // If forced change, clear the flag in metadata
      if (isForced) {
        await supabase.auth.updateUser({ data: { force_password_change: false } });
      }

      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
              <span className="text-primary-foreground font-bold text-xl">W</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">WorkOS</h1>
            <p className="text-sm text-muted-foreground mt-1">by Ulrea</p>
          </div>

          {!isReady ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isForced && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border mb-2">
                  <KeyRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Set your permanent password</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your account was created with a temporary password. Please set a new one to continue.
                    </p>
                  </div>
                </div>
              )}

              <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {isForced ? 'Create your password' : 'Set new password'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isForced ? 'Choose a secure password for your account' : 'Choose a strong password for your account'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading || !password.trim() || !confirmPassword.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isForced ? 'Set Password & Continue' : 'Update Password'}
              </Button>

              {/* Forced users cannot navigate away — no back link shown */}
              {!isForced && (
                <p className="text-center text-sm text-muted-foreground">
                  <button type="button" onClick={() => navigate('/login')} className="text-primary hover:underline">
                    Back to sign in
                  </button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ResetPasswordPage: React.FC = () => (
  <ThemeProvider>
    <ResetPasswordContent />
  </ThemeProvider>
);

export default ResetPasswordPage;
