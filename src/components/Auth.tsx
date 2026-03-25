import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Moon, Sun, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'forgotSent';

interface AuthProps {
  onLogin: (userId: string, email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
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
        // If email confirmation is disabled (immediate session), log in now
        if (data.session) {
          onLogin(data.user.id, data.user.email ?? email);
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent a confirmation link to ' + email + '. Click it to activate your account.',
          });
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

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
        <span className="text-primary-foreground font-bold text-xl">W</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">WorkOS</h1>
      <p className="text-sm text-muted-foreground mt-1">by Ulrea</p>
    </div>
  );

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <Logo />
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

      <button
        type="button"
        onClick={() => setView('forgotPassword')}
        className="text-xs text-primary hover:underline"
      >
        Forgot password?
      </button>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim() || !password.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <button type="button" onClick={() => setView('signup')} className="text-primary hover:underline font-medium">
          Sign up
        </button>
      </p>
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
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim() || !password.trim() || !confirmPassword.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button type="button" onClick={() => setView('login')} className="text-primary hover:underline font-medium">
          Sign in
        </button>
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
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email.trim()}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
      </Button>

      <button
        type="button"
        onClick={() => setView('login')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
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
        Click the link in the email to set a new password.
      </p>
      <Button variant="outline" onClick={() => setView('login')} className="w-full h-11">
        Back to Sign In
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <button
        type="button"
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
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
