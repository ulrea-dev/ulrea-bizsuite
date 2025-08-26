
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, FolderOpen, Users, UserCheck, BarChart3, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, onLogout }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="w-64 dashboard-surface border-r dashboard-border p-4 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
            <Building2 className="h-6 w-6 dashboard-text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold dashboard-text-primary">BizSuite</h1>
            <p className="text-sm dashboard-text-secondary">Management Tool</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActive ? 'dashboard-text-primary' : 'dashboard-text-secondary hover:dashboard-text-primary'
              }`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </div>

      <div className="space-y-2 pt-4 border-t dashboard-border">
        <Button variant="outline" size="sm" onClick={toggleTheme} className="w-full">
          {theme === 'light' ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button>
        
        <Button variant="outline" size="sm" onClick={onLogout} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
};
