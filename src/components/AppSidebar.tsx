import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Home, DollarSign, Moon, Sun, Download, Users, UserCheck,
  BarChart3, Briefcase, ExternalLink, Cloud, RefreshCw, ChevronDown,
  FolderKanban, ListChecks, Repeat, Calendar, Tags, TrendingUp, Receipt,
  CreditCard, Package, ShoppingCart, Warehouse, Factory, Truck, ListTodo,
  MoreHorizontal, Settings, LogOut
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { BusinessSwitcher } from './BusinessSwitcher';
import { useBusiness } from '@/contexts/BusinessContext';
import { useGoogleDrive } from '@/contexts/GoogleDriveContext';
import { exportData } from '@/utils/storage';
import { useRenewalReminders } from '@/hooks/useRenewalReminders';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface AppSidebarProps {
  onLogout: () => void;
  onCreateBusiness: () => void;
}

interface NavSubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  subItems?: NavSubItem[];
}

const worksSubItems: NavSubItem[] = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/works/projects' },
  { id: 'quick-tasks', label: 'Quick Tasks', icon: ListChecks, path: '/works/quick-tasks' },
  { id: 'retainers', label: 'Retainers', icon: Repeat, path: '/works/retainers' },
  { id: 'renewals', label: 'Renewals', icon: Calendar, path: '/works/renewals' },
  { id: 'service-types', label: 'Service Types', icon: Tags, path: '/works/service-types' },
];

const financialsSubItems: NavSubItem[] = [
  { id: 'revenue', label: 'Revenue', icon: TrendingUp, path: '/financials/revenue' },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: '/financials/payments' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, path: '/financials/expenses' },
  { id: 'salaries', label: 'Payroll', icon: Users, path: '/financials/salaries' },
  { id: 'tasks', label: 'Task Payments', icon: ListChecks, path: '/financials/tasks' },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({ onLogout, onCreateBusiness }) => {
  const { theme, toggleTheme } = useTheme();
  const { currentBusiness, data } = useBusiness();
  const { isConnected, isSyncing, syncNow, settings } = useGoogleDrive();
  const { toast } = useToast();
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { totalDueSoon, overdueCount } = useRenewalReminders();

  const overdueTodoCount = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(t => t.status === 'pending' && t.dueDate < today).length;
  }, [data.todos]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    works: location.pathname.startsWith('/works'),
    financials: location.pathname.startsWith('/financials'),
  });

  const navigationItems = useMemo((): NavItem[] => {
    const businessModel = currentBusiness?.businessModel || 'service';
    const serviceItems: NavItem[] = [
      { id: 'works', label: 'Works', icon: Briefcase, path: '/works', subItems: worksSubItems },
      { id: 'clients', label: 'Clients', icon: UserCheck, path: '/clients' },
    ];
    const productItems: NavItem[] = [
      { id: 'products', label: 'Products', icon: Package, path: '/products' },
      { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales' },
      { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
      { id: 'inventory', label: 'Inventory', icon: Warehouse, path: '/inventory' },
      { id: 'production', label: 'Production', icon: Factory, path: '/production' },
      { id: 'procurement', label: 'Procurement', icon: Truck, path: '/procurement' },
    ];
    const commonItems: NavItem[] = [
      { id: 'financials', label: 'Financials', icon: DollarSign, path: '/financials', subItems: financialsSubItems },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    ];
    if (businessModel === 'service') return [...serviceItems, ...commonItems];
    if (businessModel === 'product') return [...productItems, ...commonItems];
    return [...serviceItems, ...productItems, ...commonItems];
  }, [currentBusiness?.businessModel]);

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
      if (isConnected) await syncNow(data);
      toast({
        title: "Data Exported",
        description: isConnected
          ? "Your data has been downloaded and backed up to Google Drive."
          : "Your data has been successfully downloaded.",
      });
    } catch {
      toast({ title: "Export Failed", description: "There was an error exporting your data.", variant: "destructive" });
    }
  };

  const lastSyncLabel = settings.lastSyncTime
    ? `Last synced ${formatDistanceToNow(new Date(settings.lastSyncTime), { addSuffix: true })}`
    : 'Not synced yet';

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname === path;
  };
  const isParentActive = (path: string) => location.pathname.startsWith(path);
  const handleManageBusinesses = () => navigate('/settings');
  const toggleMenu = (menuId: string) => setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {sidebarOpen && (
            <>
              <div className="p-2 dashboard-surface-elevated rounded-lg border dashboard-border">
                <Building2 className="h-6 w-6 dashboard-text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold dashboard-text-primary">Operations</h1>
                <p className="text-xs dashboard-text-secondary">Work OS</p>
              </div>
            </>
          )}
          <SidebarTrigger className={sidebarOpen ? '' : 'mx-auto'} />
        </div>
        {sidebarOpen && (
          <div className="px-4">
            <BusinessSwitcher onCreateBusiness={onCreateBusiness} onManageBusinesses={handleManageBusinesses} />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isOpen = openMenus[item.id] || false;
                const parentActive = isParentActive(item.path);

                if (hasSubItems) {
                  return (
                    <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleMenu(item.id)} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={parentActive} tooltip={item.label}>
                            <Icon className="h-4 w-4" />
                            {sidebarOpen && (
                              <>
                                <span className="flex-1">{item.label}</span>
                                {item.id === 'works' && totalDueSoon > 0 && (
                                  <Badge variant={overdueCount > 0 ? "destructive" : "secondary"} className="h-5 min-w-5 px-1 text-xs">
                                    {totalDueSoon}
                                  </Badge>
                                )}
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems?.map((subItem) => {
                              const SubIcon = subItem.icon;
                              return (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton asChild isActive={isActive(subItem.path)}>
                                    <Link to={subItem.path}>
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subItem.label}</span>
                                      {subItem.id === 'renewals' && totalDueSoon > 0 && (
                                        <Badge variant={overdueCount > 0 ? "destructive" : "secondary"} className="ml-auto h-5 min-w-5 px-1 text-xs">
                                          {totalDueSoon}
                                        </Badge>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.label}>
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
          {/* Back to Hub */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Hub">
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                {sidebarOpen && <span>Back to Hub</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* To-Do shortcut */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname.startsWith('/todos')} tooltip="To-Do List">
              <Link to="/todos" className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  {sidebarOpen && <span>To-Do</span>}
                </span>
                {sidebarOpen && overdueTodoCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {overdueTodoCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* More menu */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip="More options">
                  <MoreHorizontal className="h-4 w-4" />
                  {sidebarOpen && <span>More</span>}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem onClick={handleBackupDownload} className="flex items-center gap-2 cursor-pointer">
                        {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : isConnected ? <Cloud className="h-4 w-4 text-green-500" /> : <Download className="h-4 w-4" />}
                        {isSyncing ? 'Syncing…' : 'Export Data'}
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    {isConnected && (
                      <TooltipContent side="right"><p>{lastSyncLabel}</p></TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2 cursor-pointer">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
