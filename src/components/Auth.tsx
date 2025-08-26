
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';

interface AuthProps {
  onLogin: (username: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { data } = useBusiness();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  const isReturningUser = data.userSettings.username && data.businesses.length > 0;

  return (
    <div className="min-h-screen dashboard-background flex items-center justify-center p-4 theme-transition">
      <div className="absolute top-6 right-6">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="hover-surface"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>
      
      <Card className="w-full max-w-md dashboard-surface border-dashboard-border shadow-lg card-hover">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 dashboard-surface-elevated rounded-xl border dashboard-border">
              <Building2 className="h-8 w-8 dashboard-text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold dashboard-text-primary">
            {isReturningUser ? 'Welcome Back' : 'Welcome to BizSuite'}
          </CardTitle>
          <CardDescription className="dashboard-text-secondary">
            {isReturningUser 
              ? `Continue as ${data.userSettings.username}` 
              : 'Your multi-business management platform'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter your name or business name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 text-center"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 font-medium"
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
    </div>
  );
};
