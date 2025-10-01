
import React from 'react';
import { Building2, FolderOpen, Users, UserCheck, BarChart3, Settings, LogOut, Moon, Sun, Download, DollarSign, ListChecks, CreditCard, Receipt } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { BusinessSwitcher } from './BusinessSwitcher';
import { useBusiness } from '@/contexts/BusinessContext';
import { exportData } from '@/utils/storage';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AppSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onCreateBusiness: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Building2 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'partners', label: 'Partners', icon: UserCheck },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'quick-tasks', label: 'Quick Tasks', icon: ListChecks },
  { id: 'salaries', label: 'Salaries', icon: DollarSign },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  onLogout, 
  onCreateBusiness 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentBusiness } = useBusiness();
  const { toast } = useToast();

  const handleBackupDownload = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizsuite-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Downloaded",
        description: "Your data has been successfully backed up and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "There was an error creating your backup. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
            <Building2 className="h-6 w-6 dashboard-text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold dashboard-text-primary">BizSuite</h1>
            <p className="text-sm dashboard-text-secondary">Management Tool</p>
          </div>
        </div>
        
        <div className="px-4">
          <BusinessSwitcher 
            onCreateBusiness={onCreateBusiness}
            onManageBusinesses={() => onPageChange('settings')}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onPageChange(item.id)}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleBackupDownload} tooltip="Download Backup">
                  <Download className="h-4 w-4" />
                  <span>Backup Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
