import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Briefcase, 
  LayoutDashboard, 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  ArrowLeft,
  Moon,
  Sun,
  Download,
  Users,
  Layers,
  UserCog
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
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

interface AdminSidebarProps {
  onBackToApp: () => void;
}

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/business-management' },
  { id: 'businesses', label: 'Businesses', icon: Building2, path: '/business-management/businesses' },
  { id: 'business-access', label: 'Business Access', icon: Users, path: '/business-management/business-access' },
  { id: 'team-members', label: 'Team Members', icon: UserCog, path: '/business-management/team-members' },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: Wallet, path: '/business-management/bank-accounts' },
  { id: 'partners', label: 'Partners', icon: Users, path: '/business-management/partners' },
  { id: 'partner-allocations', label: 'Partner Allocations', icon: Layers, path: '/business-management/partner-allocations' },
  { id: 'payables', label: 'Payables', icon: ArrowUpRight, path: '/business-management/payables' },
  { id: 'receivables', label: 'Receivables', icon: ArrowDownLeft, path: '/business-management/receivables' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onBackToApp }) => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();

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

  const isActive = (path: string) => {
    if (path === '/business-management') {
      return location.pathname === '/business-management';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {sidebarOpen && (
            <>
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold dashboard-text-primary">Admin Console</h1>
                <p className="text-xs dashboard-text-secondary">Business Management</p>
              </div>
            </>
          )}
          <SidebarTrigger className={sidebarOpen ? '' : 'mx-auto'} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        {sidebarOpen && <span>{item.label}</span>}
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
            <SidebarMenuButton onClick={onBackToApp} tooltip="Back to BizSuite">
              <ArrowLeft className="h-4 w-4" />
              {sidebarOpen && <span>Back to BizSuite</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
