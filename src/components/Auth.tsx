import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness, setRestoringData } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { importData } from '@/utils/storage';
import { Briefcase, Upload, Play, ChevronDown, Moon, Sun, Loader2, Cloud, CloudOff } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

interface AuthProps {
  onLogin: (username: string) => void;
}

type AuthView = 'main' | 'newUser' | 'backupSelection';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { data, dispatch } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const {
    isConnected,
    isLoading: isGoogleLoading,
    connect,
    loadBackups,
    backups,
    restoreBackup,
    currentAccount,
    showAccountSelection,
    isDiscoveringAccounts,
  } = useGoogleDrive();
  
  const [username, setUsername] = useState('');
  const [showSwitchUser, setShowSwitchUser] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState<AuthView>('main');
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const existingUser = data.userSettings.username;
  const businessCount = data.businesses.length;
  const projectCount = data.projects.length;

  // Track if user explicitly connected (to differentiate from returning to login after logout)
  const [hasExplicitlyConnected, setHasExplicitlyConnected] = useState(false);

  // When Google connects and account already exists, load backups
  useEffect(() => {
    if (isConnected && hasExplicitlyConnected && currentAccount && view === 'main' && !isLoadingBackups) {
      handleLoadBackupsForAccount();
    }
  }, [isConnected, hasExplicitlyConnected, currentAccount, view]);

  // When Google connects but no workspace exists, go straight to name entry
  useEffect(() => {
    if (isConnected && hasExplicitlyConnected && !currentAccount && view === 'main') {
      setView('newUser');
    }
  }, [isConnected, hasExplicitlyConnected, currentAccount, view]);

  const handleLoadBackupsForAccount = async () => {
    setIsLoadingBackups(true);
    try {
      await loadBackups();
      // After loading, check if we should auto-restore or show selection
    } catch (error) {
      console.error('Failed to load backups:', error);
      setHasExplicitlyConnected(false);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Auto-restore latest backup when backups are loaded
  useEffect(() => {
    if (isConnected && hasExplicitlyConnected && currentAccount && backups.length > 0 && view === 'main' && !isRestoring && !isLoadingBackups && !showAccountSelection) {
      // Auto-restore the latest backup
      handleRestoreBackup(backups[0].id);
    } else if (isConnected && hasExplicitlyConnected && currentAccount && backups.length === 0 && !isLoadingBackups && view === 'main' && !showAccountSelection) {
      // No backups found, proceed to backup selection to show options
      setView('backupSelection');
    }
  }, [isConnected, hasExplicitlyConnected, currentAccount, backups, view, isRestoring, isLoadingBackups, showAccountSelection]);

  const handleLoadGoogleBackups = async () => {
    setIsLoadingBackups(true);
    try {
      await loadBackups();
      setView('backupSelection');
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleGoogleLogin = () => {
    setHasExplicitlyConnected(true);
    if (isConnected) {
      // Already connected
      if (currentAccount) {
        handleLoadGoogleBackups();
      } else {
        // No workspace yet — let user login first, workspace prompt comes after
        setView('newUser');
      }
    } else {
      connect();
    }
  };

  const handleRestoreBackup = async (fileId: string) => {
    setIsRestoring(true);
    setRestoringData(true); // Prevent auto-sync during restore
    try {
      const restoredData = await restoreBackup(fileId);
      
      // CRITICAL: Load the restored data into the app state
      if (restoredData) {
        dispatch({ type: 'LOAD_DATA', payload: restoredData });
      }
      
      if (restoredData?.userSettings?.username) {
        onLogin(restoredData.userSettings.username);
      } else {
        // If no username in backup, go to new user flow
        setView('newUser');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setIsRestoring(false);
      // Re-enable sync after a short delay to ensure data is fully loaded
      setTimeout(() => setRestoringData(false), 1000);
    }
  };

  const handleStartFresh = () => {
    setView('newUser');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  const handleContinue = () => {
    if (existingUser) {
      onLogin(existingUser);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          setRestoringData(true); // Prevent auto-sync during restore
          const text = e.target?.result as string;
          const importedData = importData(text);
          dispatch({ type: 'LOAD_DATA', payload: importedData });
          if (importedData.userSettings?.username) {
            onLogin(importedData.userSettings.username);
          }
          setTimeout(() => setRestoringData(false), 1000);
        } catch (error) {
          console.error('Failed to restore backup:', error);
          setRestoringData(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = async () => {
    try {
      const response = await fetch('/demo-data.json');
      const demoData = await response.json();
      const importedData = importData(JSON.stringify(demoData));
      dispatch({ type: 'LOAD_DATA', payload: importedData });
      if (importedData.userSettings?.username) {
        onLogin(importedData.userSettings.username);
      }
    } catch (error) {
      console.error('Failed to load demo data:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatBackupDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy · h:mm a');
    } catch {
      return dateString;
    }
  };

  const renderBackupSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
          <Cloud className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Google Drive Connected</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {currentAccount && (
            <span className="block text-xs text-primary mb-1">Workspace: {currentAccount.name}</span>
          )}
          {backups.length > 0 
            ? `Found ${backups.length} backup${backups.length === 1 ? '' : 's'} in your Drive`
            : 'No backups found in your Drive'}
        </p>
      </div>

      {backups.length > 0 ? (
        <div className="space-y-3">
          {/* Latest backup highlight */}
          <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary">Latest Backup</span>
              <span className="text-xs text-muted-foreground">
                {formatBackupDate(backups[0].createdTime)}
              </span>
            </div>
            <p className="text-sm text-foreground font-medium mb-3">{backups[0].name}</p>
            <Button 
              onClick={() => handleRestoreBackup(backups[0].id)} 
              className="w-full"
              disabled={isRestoring}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                'Restore Latest'
              )}
            </Button>
          </div>

          {/* Older backups */}
          {backups.length > 1 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                <span>Show {backups.length - 1} older backup{backups.length > 2 ? 's' : ''}</span>
                <ChevronDown className="w-4 h-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {backups.slice(1, 5).map((backup) => (
                  <button
                    key={backup.id}
                    onClick={() => handleRestoreBackup(backup.id)}
                    disabled={isRestoring}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{backup.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatBackupDate(backup.createdTime)}
                      </span>
                    </div>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <CloudOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No backups found. Start fresh and your data will be automatically synced.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setView('main')} 
          className="flex-1"
          disabled={isRestoring}
        >
          Back
        </Button>
        <Button 
          variant="secondary" 
          onClick={handleStartFresh} 
          className="flex-1"
          disabled={isRestoring}
        >
          Start Fresh
        </Button>
      </div>
    </div>
  );

  const renderNewUserFlow = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-semibold text-foreground">
          {showSwitchUser ? 'Switch Account' : 'Get Started'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your name to continue
        </p>
      </div>

      <Input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="h-11 text-center"
        autoFocus
      />

      <Button type="submit" className="w-full h-11" size="lg" disabled={!username.trim()}>
        {showSwitchUser ? 'Switch' : 'Get Started'}
      </Button>

      {(showSwitchUser || view === 'newUser') && (
        <button
          type="button"
          onClick={() => {
            setShowSwitchUser(false);
            setView('main');
          }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {existingUser ? `Back to ${existingUser.split(' ')[0]}` : 'Back'}
        </button>
      )}
    </form>
  );

  const renderMainFlow = () => (
    <>
      {/* Returning User Flow */}
      {existingUser && !showSwitchUser ? (
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(existingUser)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome back, {existingUser.split(' ')[0]}
              </h2>
              {(businessCount > 0 || projectCount > 0) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {businessCount} {businessCount === 1 ? 'business' : 'businesses'} · {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                </p>
              )}
            </div>
          </div>

          <Button onClick={handleContinue} className="w-full h-11" size="lg">
            Continue
          </Button>

          <button
            onClick={() => setShowSwitchUser(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Not {existingUser.split(' ')[0]}? Switch account
          </button>
        </div>
      ) : (
        /* New User / Switch User Flow */
        <div className="space-y-6">
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-foreground">
              {showSwitchUser ? 'Switch Account' : 'Get Started'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Continue with Google or enter your name
            </p>
          </div>

          {/* Google Login Button */}
          <Button 
            onClick={handleGoogleLogin} 
            variant="outline" 
            className="w-full h-11 gap-2"
            disabled={isGoogleLoading || isLoadingBackups || isDiscoveringAccounts}
          >
            {isGoogleLoading || isLoadingBackups || isDiscoveringAccounts ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isDiscoveringAccounts ? 'Finding workspaces...' : isLoadingBackups ? 'Loading backups...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Name Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 text-center"
            />

            <Button type="submit" className="w-full h-11" size="lg" disabled={!username.trim()}>
              {showSwitchUser ? 'Switch' : 'Get Started'}
            </Button>
          </form>

          {showSwitchUser && (
            <button
              type="button"
              onClick={() => setShowSwitchUser(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to {existingUser?.split(' ')[0]}
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-gradient relative">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 backdrop-blur-sm mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">BizSuite</h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-business management</p>
        </div>

        <Card className="login-card border-border/50">
          <CardContent className="pt-6 pb-6">
            {view === 'backupSelection' && renderBackupSelection()}
            {view === 'newUser' && renderNewUserFlow()}
            {view === 'main' && renderMainFlow()}
          </CardContent>
        </Card>

        {/* Advanced Options - only show on main view */}
        {view === 'main' && (
          <div className="mt-6">
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span>More options</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleLoadDemo}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Try demo
                  </button>
                  <span className="text-muted-foreground/50">·</span>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Restore backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

    </div>
  );
};
