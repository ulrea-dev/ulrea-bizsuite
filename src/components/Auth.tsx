import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { importData } from '@/utils/storage';
import { Briefcase, Upload, Play, ChevronDown, Moon, Sun } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/hooks/useTheme';

interface AuthProps {
  onLogin: (username: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { data, dispatch } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [showSwitchUser, setShowSwitchUser] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const existingUser = data.userSettings.username;
  const businessCount = data.businesses.length;
  const projectCount = data.projects.length;

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
          const text = e.target?.result as string;
          const importedData = importData(text);
          dispatch({ type: 'LOAD_DATA', payload: importedData });
          if (importedData.userSettings?.username) {
            onLogin(importedData.userSettings.username);
          }
        } catch (error) {
          console.error('Failed to restore backup:', error);
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

                {showSwitchUser && (
                  <button
                    type="button"
                    onClick={() => setShowSwitchUser(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to {existingUser?.split(' ')[0]}
                  </button>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        {/* Advanced Options */}
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
      </div>
    </div>
  );
};
