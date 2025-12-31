
import React from 'react';
import { Building2, Home, FolderKanban, DollarSign, Settings, LogOut, Moon, Sun, Download, Users, UserCheck, BarChart3 } from 'lucide-react';
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

interface AppSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  onCreateBusiness: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'clients', label: 'Clients', icon: UserCheck },
  { id: 'financials', label: 'Financials', icon: DollarSign },
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
  const { open: sidebarOpen } = useSidebar();

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
        title: "Data Exported",
        description: "Your data has been successfully exported and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <SidebarTrigger />
          {sidebarOpen && (
            <>
              <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
                <Building2 className="h-6 w-6 dashboard-text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold dashboard-text-primary">BizSuite</h1>
                <p className="text-sm dashboard-text-secondary">Management Tool</p>
              </div>
            </>
          )}
        </div>
        
        {sidebarOpen && (
          <div className="px-4">
            <BusinessSwitcher 
              onCreateBusiness={onCreateBusiness}
              onManageBusinesses={() => onPageChange('settings')}
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                      {sidebarOpen && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleBackupDownload} tooltip="Export Data">
              <Download className="h-4 w-4" />
              {sidebarOpen && <span>Export Data</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {sidebarOpen && <span>{theme === 'light' ? 'Dark' : 'Light'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Log Out">
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span>Log Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};