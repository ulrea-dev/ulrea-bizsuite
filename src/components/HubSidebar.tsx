import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Settings2, ListTodo, Moon, Sun, Download, LogOut, Cloud, RefreshCw, ExternalLink, Home } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { exportData } from '@/utils/storage';
import { BusinessSwitcher } from './BusinessSwitcher';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface HubSidebarProps {
  onLogout: () => void;
  onCreateBusiness: () => void;
}

export const HubSidebar: React.FC<HubSidebarProps> = ({ onLogout, onCreateBusiness }) => {
  const { theme, toggleTheme } = useTheme();
  const { data } = useBusiness();
  const { isConnected, isSyncing, syncNow, settings } = useGoogleDrive();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const overdueTodoCount = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(t => t.status === 'pending' && t.dueDate < today).length;
  }, [data.todos]);

  const handleBackupDownload = async () => {
    try {
      const localData = exportData();
      const blob = new Blob([localData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizsuite-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (isConnected) {
        await syncNow(data);
      }
      
      toast({
        title: "Data Exported",
        description: isConnected 
          ? "Your data has been downloaded and backed up to Google Drive."
          : "Your data has been successfully downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const lastSyncLabel = settings.lastSyncTime
    ? `Last synced ${formatDistanceToNow(new Date(settings.lastSyncTime), { addSuffix: true })}`
    : 'Not synced yet';

  const handleManageBusinesses = () => {
    navigate('/settings');
  };

  const areas = [
    {
      id: 'operations',
      label: 'Operations',
      icon: Briefcase,
      path: '/works/projects',
      description: 'Projects, clients & finances',
    },
    {
      id: 'back-office',
      label: 'Back Office',
      icon: Settings2,
      path: '/business-management',
      description: 'Team, partners & settings',
    },
    {
      id: 'todo',
      label: 'To-Do',
      icon: ListTodo,
      path: '/todos',
      description: 'Tasks & reminders',
      badge: overdueTodoCount > 0 ? overdueTodoCount : undefined,
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {sidebarOpen && (
            <>
              <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
                <Home className="h-6 w-6 dashboard-text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold dashboard-text-primary">Work OS</h1>
                <p className="text-xs dashboard-text-secondary">Hub</p>
              </div>
            </>
          )}
          <SidebarTrigger className={sidebarOpen ? '' : 'mx-auto'} />
        </div>
        
        {sidebarOpen && (
          <div className="px-4">
            <BusinessSwitcher 
              onCreateBusiness={onCreateBusiness}
              onManageBusinesses={handleManageBusinesses}
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {areas.map((area) => {
                const Icon = area.icon;
                return (
                  <SidebarMenuItem key={area.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={area.label}
                    >
                      <Link to={area.path} className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {sidebarOpen && <span>{area.label}</span>}
                        </span>
                        {sidebarOpen && area.badge && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                            {area.badge}
                          </Badge>
                        )}
                      </Link>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton onClick={handleBackupDownload} tooltip="Export Data">
                    {isSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : isConnected ? (
                      <Cloud className="h-4 w-4 text-green-500" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {sidebarOpen && <span>{isSyncing ? 'Syncing...' : 'Export Data'}</span>}
                  </SidebarMenuButton>
                </TooltipTrigger>
                {isConnected && (
                  <TooltipContent side="right">
                    <p>{lastSyncLabel}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'light' ? 'Dark' : 'Light'}>
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
