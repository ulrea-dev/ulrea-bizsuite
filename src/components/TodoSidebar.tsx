import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck, Calendar, CalendarDays, AlertCircle, Users, ListTodo,
  ArrowLeft, Moon, Sun, Briefcase, Settings, MoreHorizontal, LogOut, Download,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
import { exportData } from '@/utils/storage';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TodoSidebarProps {
  onBackToApp: () => void;
}

export const TodoSidebar: React.FC<TodoSidebarProps> = ({ onBackToApp }) => {
  const { theme, toggleTheme } = useTheme();
  const { data } = useBusiness();
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { todayCount, overdueCount, weekCount } = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekEnd = weekFromNow.toISOString().split('T')[0];
    const pending = todos.filter(t => t.status === 'pending');
    const overdue = pending.filter(t => t.dueDate < today).length;
    const todayTasks = pending.filter(t => t.dueDate === today).length;
    const thisWeek = pending.filter(t => t.dueDate >= today && t.dueDate <= weekEnd).length;
    return { overdueCount: overdue, todayCount: todayTasks + overdue, weekCount: thisWeek };
  }, [data.todos]);

  const handleLogout = () => navigate('/login');

  const handleExport = () => {
    try {
      const exportedData = exportData();
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizsuite-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Data Exported", description: "Your data has been successfully exported." });
    } catch {
      toast({ title: "Export Failed", description: "There was an error exporting your data.", variant: "destructive" });
    }
  };

  const isActive = (path: string) => {
    if (path === '/todos') return location.pathname === '/todos';
    return location.pathname === path;
  };

  // Core navigation: Today, Week, Overdue, All (slimmed from 7 → 4 primary + 2 grouped)
  type NavItemDef = {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<React.RefAttributes<SVGSVGElement> & { className?: string }>;
    path: string;
    badge?: number;
    badgeVariant?: 'destructive' | 'secondary';
  };

  const primaryItems: NavItemDef[] = [
    {
      id: 'today', label: 'Today', icon: CalendarCheck, path: '/todos/today',
      badge: todayCount > 0 ? todayCount : undefined,
      badgeVariant: overdueCount > 0 ? 'destructive' : 'secondary',
    },
    {
      id: 'overdue', label: 'Overdue', icon: AlertCircle, path: '/todos/overdue',
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive',
    },
  ];

  const scheduleItems: NavItemDef[] = [
    {
      id: 'week', label: 'This Week', icon: Calendar, path: '/todos/week',
      badge: weekCount > 0 ? weekCount : undefined,
      badgeVariant: 'secondary',
    },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, path: '/todos/upcoming' },
  ];

  const viewItems = [
    { id: 'by-assignee', label: 'By Assignee', icon: Users, path: '/todos/by-assignee' },
    { id: 'all', label: 'All Tasks', icon: ListTodo, path: '/todos/all' },
  ];

  const renderNavItem = (item: typeof primaryItems[0]) => {
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.label}>
          <Link to={item.path}>
            <Icon className="h-4 w-4" />
            {sidebarOpen && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <Badge variant={item.badgeVariant || 'secondary'} className="h-5 min-w-5 px-1 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          {sidebarOpen && (
            <>
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold text-foreground">To-Do List</h1>
                <p className="text-xs text-muted-foreground">Task Management</p>
              </div>
            </>
          )}
          <SidebarTrigger className={sidebarOpen ? '' : 'mx-auto'} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary: Today & Overdue */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Priority</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Schedule: Week & Upcoming */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Schedule</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {scheduleItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Views: By Assignee & All */}
        <SidebarGroup>
          {sidebarOpen && <SidebarGroupLabel>Views</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {viewItems.map(item => {
                const Icon = item.icon;
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
            <SidebarMenuButton onClick={onBackToApp} tooltip="Back to Hub">
              <ArrowLeft className="h-4 w-4" />
              {sidebarOpen && <span>Back to Hub</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Back Office shortcut */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back Office">
              <Link to="/business-management">
                <Briefcase className="h-4 w-4" />
                {sidebarOpen && <span>Back Office</span>}
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
                <DropdownMenuItem onClick={handleExport} className="flex items-center gap-2 cursor-pointer">
                  <Download className="h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2 cursor-pointer">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
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
