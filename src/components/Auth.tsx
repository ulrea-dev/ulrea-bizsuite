import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { Moon, Sun, Loader2, Eye, EyeOff, ArrowLeft, MailCheck } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'forgotSent' | 'verifyOtp';

interface AuthProps {
  onLogin: (userId: string, email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP state
  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // If redirected here because account is not verified, show the OTP screen
  useEffect(() => {
    if (searchParams.get('unverified') === '1') {
      // Try to get the current unverified session email
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email && !data.session.user.email_confirmed_at) {
          setEmail(data.session.user.email);
          setView('verifyOtp');
          // Sign them out so they can't sneak in
          supabase.auth.signOut();
          toast({
            title: 'Email verification required',
            description: 'Please verify your email to continue.',
            variant: 'destructive',
          });
        }
      });
    }
  }, []);

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
        // Block unverified users — send them to OTP screen
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setOtpValue('');
          setView('verifyOtp');
          toast({
            title: 'Email not verified',
            description: 'Enter the verification code sent to your email.',
            variant: 'destructive',
          });
          // Resend OTP so they have a fresh code
          await supabase.auth.resend({ type: 'signup', email: email.trim() });
          return;
        }
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
          // Email confirmation disabled — logged in directly
          onLogin(data.user.id, data.user.email ?? email);
        } else {
          // Email confirmation required — show OTP entry
          setOtpValue('');
          setView('verifyOtp');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpValue,
        type: 'signup',
      });
      if (error) {
        toast({ title: 'Verification failed', description: 'The code is incorrect or has expired. Please try again.', variant: 'destructive' });
        setOtpValue('');
        return;
      }
      if (data.user) {
        toast({ title: 'Email verified!', description: 'Welcome to WorkOS.' });
        onLogin(data.user.id, data.user.email ?? email);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) {
        toast({ title: 'Could not resend code', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'New code sent', description: `Check ${email} for a fresh code.` });
      setOtpValue('');
    } finally {
      setIsResending(false);
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

  const renderVerifyOtp = () => (
    <div className="space-y-6">
      <Logo />
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-4">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Check your inbox</h2>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a verification code to{' '}
          <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-muted-foreground">Enter the code from your email</p>
        <InputOTP
          maxLength={6}
          value={otpValue}
          onChange={(val) => {
            setOtpValue(val);
            if (val.length === 6) {
              // Auto-submit when all digits entered
              setTimeout(() => {
                setIsVerifying(true);
                supabase.auth.verifyOtp({ email: email.trim(), token: val, type: 'signup' })
                  .then(({ data, error }) => {
                    if (error) {
                      toast({ title: 'Verification failed', description: 'Incorrect or expired code.', variant: 'destructive' });
                      setOtpValue('');
                    } else if (data.user) {
                      toast({ title: 'Email verified!', description: 'Welcome to WorkOS.' });
                      onLogin(data.user.id, data.user.email ?? email);
                    }
                  })
                  .finally(() => setIsVerifying(false));
              }, 100);
            }
          }}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {isVerifying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          className="w-full h-11"
          onClick={handleVerifyOtp}
          disabled={otpValue.length < 6 || isVerifying}
        >
          {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Email'}
        </Button>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={() => { setView('signup'); setOtpValue(''); }}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Change email
          </button>
        </div>
      </div>
    </div>
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
          {view === 'verifyOtp' && renderVerifyOtp()}
          {view === 'forgotPassword' && renderForgotPassword()}
          {view === 'forgotSent' && renderForgotSent()}
        </div>
      </div>
    </div>
  );
};
