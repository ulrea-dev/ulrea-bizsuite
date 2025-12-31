
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Moon, Sun, Upload } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
import { importData } from '@/utils/storage';

interface AuthProps {
  onLogin: (username: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { data, dispatch } = useBusiness();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) return;
    
    try {
      const text = await importFile.text();
      const importedData = importData(text);
      dispatch({ type: 'LOAD_DATA', payload: importedData });
      
      // If the backup has a username, use it to auto-login
      if (importedData.userSettings.username) {
        onLogin(importedData.userSettings.username);
      } else {
        alert('Backup imported successfully! Please enter a username to continue.');
      }
      
      setImportFile(null);
    } catch (error) {
      alert('Error importing backup. Please check the file format.');
    }
  };

  const handleLoadDemo = async () => {
    try {
      const response = await fetch('/demo-data.json');
      const demoData = await response.json();
      const importedData = importData(JSON.stringify(demoData));
      dispatch({ type: 'LOAD_DATA', payload: importedData });
      
      // Auto-login with demo user
      onLogin(importedData.userSettings.username);
    } catch (error) {
      alert('Error loading demo data. Please try again.');
    }
  };

  const isReturningUser = data.userSettings.username && data.businesses.length > 0;

  return (
    <div className="min-h-screen dashboard-background flex items-center justify-center p-3 sm:p-4 theme-transition">
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="hover-surface h-9 w-9 sm:h-10 sm:w-10"
        >
          {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>
      
      <div className="w-full max-w-md space-y-3 sm:space-y-4">
        <Card className="dashboard-surface border-dashboard-border shadow-lg card-hover">
          <CardHeader className="text-center pb-4 sm:pb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 dashboard-surface-elevated rounded-xl border dashboard-border">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 dashboard-text-primary" />
              </div>
            </div>
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold dashboard-text-primary">
              {isReturningUser ? 'Welcome Back' : 'Welcome to BizSuite'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base dashboard-text-secondary">
              {isReturningUser 
                ? `Continue as ${data.userSettings.username}` 
                : 'Your multi-business management platform'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your name to get started"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 sm:h-12 text-center text-sm sm:text-base"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-10 sm:h-12 font-medium text-sm sm:text-base"
                disabled={!username.trim()}
              >
                {isReturningUser ? 'Continue' : 'Get Started'}
              </Button>
            </form>
            
            {isReturningUser && (
              <div className="mt-6 pt-4 border-t dashboard-border">
                <p className="text-sm dashboard-text-muted text-center">
                  {data.businesses.length} business{data.businesses.length !== 1 ? 'es' : ''} • 
                  {data.projects.length} project{data.projects.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo & Import Options */}
        <Card className="dashboard-surface border-dashboard-border shadow-lg card-hover">
          <CardHeader className="text-center pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold dashboard-text-primary flex items-center justify-center gap-2">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Quick Start Options
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm dashboard-text-secondary">
              Load demo data or restore your backup
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Load Demo Button */}
            <Button 
              onClick={handleLoadDemo} 
              variant="default" 
              className="w-full flex items-center gap-2 h-10 sm:h-11 text-sm sm:text-base"
            >
              <Building2 className="h-4 w-4" />
              Load Demo Data
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t dashboard-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 dashboard-text-muted">Or</span>
              </div>
            </div>
            
            {/* Import Backup Section */}
            <div className="space-y-3">
              <Input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
              
              <Button 
                onClick={handleImportBackup} 
                disabled={!importFile}
                variant="outline" 
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Restore Backup
              </Button>
            </div>
            
            <p className="text-xs dashboard-text-muted text-center">
              Demo includes 2 businesses with projects, team members, and payments
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
