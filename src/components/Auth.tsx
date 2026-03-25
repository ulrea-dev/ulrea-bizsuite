import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { useBusiness, setRestoringData } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Moon, Sun, Loader2, Eye, EyeOff, ArrowLeft, ChevronDown, Cloud, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, formatDistanceToNow } from 'date-fns';

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'forgotSent' | 'legacySetPassword';

interface AuthProps {
  onLogin: (userId: string, email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { dispatch } = useBusiness();
  const {
    isConnected: isGoogleConnected,
    isLoading: isGoogleLoading,
    connect: connectGoogle,
    settings: googleSettings,
    loadBackups,
    backups,
    restoreBackup,
  } = useGoogleDrive();

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Legacy Google flow state
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyStep, setLegacyStep] = useState<'connect' | 'restore' | 'setPassword'>('connect');
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [legacyEmail, setLegacyEmail] = useState('');
  const [legacyPassword, setLegacyPassword] = useState('');
  const [legacyConfirm, setLegacyConfirm] = useState('');
  const [showLegacyPassword, setShowLegacyPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // When Google connects in legacy flow, move to restore step
  useEffect(() => {
    if (isGoogleConnected && showLegacy && legacyStep === 'connect') {
      const email = googleSettings.connectedEmail || '';
      setLegacyEmail(email);
      setLegacyStep('restore');
      // Load backups
      setIsLoadingBackups(true);
      loadBackups().finally(() => setIsLoadingBackups(false));
    }
  }, [isGoogleConnected, showLegacy, legacyStep, googleSettings.connectedEmail]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        return;
      }
      if (data.user) {
        onLogin(data.user.id, data.user.email ?? email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) return;
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return;
      }
      if (data.user) {
        if (data.session) {
          onLogin(data.user.id, data.user.email ?? email);
        } else {
          toast({ title: 'Check your email', description: 'We sent a confirmation link to ' + email + '.' });
          setView('login');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: 'Failed to send reset link', description: error.message, variant: 'destructive' });
        return;
      }
      setView('forgotSent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreAndContinue = async (fileId: string) => {
    setIsRestoring(true);
    setRestoringData(true);
    try {
      const restoredData = await restoreBackup(fileId);
      if (restoredData) {
        dispatch({ type: 'LOAD_DATA', payload: restoredData });
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast({ title: 'Restore failed', description: 'Could not load backup. You can still set a password and continue.', variant: 'destructive' });
    } finally {
      setIsRestoring(false);
      setTimeout(() => setRestoringData(false), 1000);
    }
    // Move to set password step regardless
    setLegacyStep('setPassword');
  };

  const handleSkipRestore = () => {
    setLegacyStep('setPassword');
  };

  const handleCreateLegacyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyEmail.trim() || !legacyPassword.trim() || !legacyConfirm.trim()) return;
    if (legacyPassword !== legacyConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (legacyPassword.length < 6) {
      toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' });
      return;
    }
    setIsCreatingAccount(true);
    try {
      // Try sign up first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: legacyEmail.trim(),
        password: legacyPassword,
        options: { emailRedirectTo: window.location.origin },
      });

      if (!signUpError && signUpData.user && signUpData.session) {
        // Account created and session active
        toast({ title: 'Account created!', description: 'Your Google Drive data has been linked to your new account.' });
        onLogin(signUpData.user.id, signUpData.user.email ?? legacyEmail);
        return;
      }

      if (!signUpError && signUpData.user && !signUpData.session) {
        // Email confirmation needed
        toast({ title: 'Confirm your email', description: 'We sent a link to ' + legacyEmail + '. Click it then sign in.' });
        setShowLegacy(false);
        setView('login');
        setEmail(legacyEmail);
        return;
      }

      // If account already exists, try signing in (user may have an account already)
      if (signUpError?.message?.toLowerCase().includes('already registered') ||
          signUpError?.message?.toLowerCase().includes('user already')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: legacyEmail.trim(),
          password: legacyPassword,
        });
        if (signInError) {
          toast({ title: 'Account already exists', description: 'Please sign in with your existing password or reset it.', variant: 'destructive' });
          return;
        }
        if (signInData.user) {
          toast({ title: 'Welcome back!', description: 'Signed in with your existing account.' });
          onLogin(signInData.user.id, signInData.user.email ?? legacyEmail);
          return;
        }
      }

      toast({ title: 'Error creating account', description: signUpError?.message, variant: 'destructive' });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
        <span className="text-primary-foreground font-bold text-xl">W</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">WorkOS</h1>
      <p className="text-sm text-muted-foreground mt-1">by Ulrea</p>
    </div>
  );

  // ── Legacy Google section ────────────────────────────────────────────────────
  const renderLegacySection = () => (
    <Collapsible open={showLegacy} onOpenChange={setShowLegacy}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <span>Legacy Google user?</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showLegacy ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          {legacyStep === 'connect' && (
            <>
              <p className="text-xs text-muted-foreground text-center">
                If you previously used WorkOS with Google Drive, connect your Google account to retrieve your data and set up a password.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={connectGoogle}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Connect Google Account
              </Button>
            </>
          )}

          {legacyStep === 'restore' && (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Cloud className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Connected as</p>
                  <p className="text-xs text-muted-foreground">{legacyEmail}</p>
                </div>
              </div>

              {isLoadingBackups ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your Drive backups…
                </div>
              ) : backups.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Found {backups.length} backup{backups.length > 1 ? 's' : ''} — restore latest?</p>
                  <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-2">
                    <p className="text-xs text-foreground font-medium">{backups[0].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(backups[0].createdTime), 'MMM d, yyyy · h:mm a')}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRestoreAndContinue(backups[0].id)}
                      disabled={isRestoring}
                    >
                      {isRestoring ? (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Restoring…</>
                      ) : (
                        'Restore & Set Password'
                      )}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSkipRestore}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    Skip restore, just set password
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">No Drive backups found for this account.</p>
                  <Button type="button" size="sm" className="w-full" onClick={handleSkipRestore}>
                    Set Up Password
                  </Button>
                </div>
              )}
            </>
          )}

          {legacyStep === 'setPassword' && (
            <form onSubmit={handleCreateLegacyAccount} className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Set a password for your account to sign in without Google next time.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="legacy-email" className="text-xs">Email</Label>
                <Input
                  id="legacy-email"
                  type="email"
                  value={legacyEmail}
                  onChange={(e) => setLegacyEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legacy-password" className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    id="legacy-password"
                    type={showLegacyPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={legacyPassword}
                    onChange={(e) => setLegacyPassword(e.target.value)}
                    className="h-9 text-sm pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLegacyPassword(!showLegacyPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showLegacyPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legacy-confirm" className="text-xs">Confirm Password</Label>
                <Input
                  id="legacy-confirm"
                  type={showLegacyPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={legacyConfirm}
                  onChange={(e) => setLegacyConfirm(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-9 text-sm"
                disabled={isCreatingAccount || !legacyEmail.trim() || !legacyPassword.trim() || !legacyConfirm.trim()}
              >
                {isCreatingAccount ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Creating account…</>
                ) : (
                  'Create Account & Sign In'
                )}
              </Button>
              <button
                type="button"
                onClick={() => setLegacyStep('restore')}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
            </form>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  // ── Main views ───────────────────────────────────────────────────────────────
  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <Logo />
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="button" onClick={() => setView('forgotPassword')} className="text-xs text-primary hover:underline">
        Forgot password?
      </button>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim() || !password.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <button type="button" onClick={() => setView('signup')} className="text-primary hover:underline font-medium">Sign up</button>
      </p>

      <div className="pt-2">
        {renderLegacySection()}
      </div>
    </form>
  );

  const renderSignup = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      <Logo />
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Create your account</h2>
        <p className="text-sm text-muted-foreground mt-1">Start managing your workspace</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim() || !password.trim() || !confirmPassword.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={() => setView('login')} className="text-primary hover:underline font-medium">Sign in</button>
      </p>
    </form>
  );

  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <Logo />
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
        <p className="text-sm text-muted-foreground mt-1">We'll send a recovery link to your email</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
      </Button>

      <button type="button" onClick={() => setView('login')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </form>
  );

  const renderForgotSent = () => (
    <div className="space-y-4 text-center">
      <Logo />
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto">
        <span className="text-2xl">📬</span>
      </div>
      <h2 className="text-xl font-semibold text-foreground">Check your inbox</h2>
      <p className="text-sm text-muted-foreground">
        We sent a password reset link to <strong className="text-foreground">{email}</strong>.
      </p>
      <Button variant="outline" onClick={() => setView('login')} className="w-full h-11">Back to Sign In</Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button type="button" onClick={toggleTheme} className="fixed top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8">
          {view === 'login' && renderLogin()}
          {view === 'signup' && renderSignup()}
          {view === 'forgotPassword' && renderForgotPassword()}
          {view === 'forgotSent' && renderForgotSent()}
        </div>
      </div>
    </div>
  );
};
