import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Calendar, 
  CalendarDays, 
  AlertCircle, 
  Users, 
  ListTodo, 
  ArrowLeft,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBusiness } from '@/contexts/BusinessContext';
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
import { Badge } from '@/components/ui/badge';

interface TodoSidebarProps {
  onBackToApp: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

export const TodoSidebar: React.FC<TodoSidebarProps> = ({ onBackToApp }) => {
  const { theme, toggleTheme } = useTheme();
  const { data } = useBusiness();
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();

  // Calculate counts for badges
  const { todayCount, overdueCount, weekCount } = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekEnd = weekFromNow.toISOString().split('T')[0];

    const pendingTodos = todos.filter(t => t.status === 'pending');
    
    const overdue = pendingTodos.filter(t => t.dueDate < today).length;
    const todayTasks = pendingTodos.filter(t => t.dueDate === today).length;
    const thisWeek = pendingTodos.filter(t => t.dueDate >= today && t.dueDate <= weekEnd).length;

    return {
      overdueCount: overdue,
      todayCount: todayTasks + overdue, // Include overdue in today's view
      weekCount: thisWeek,
    };
  }, [data.todos]);

  const navigationItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/todos' },
    { 
      id: 'today', 
      label: 'Today', 
      icon: CalendarCheck, 
      path: '/todos/today',
      badge: todayCount > 0 ? todayCount : undefined,
      badgeVariant: overdueCount > 0 ? 'destructive' : 'secondary'
    },
    { 
      id: 'week', 
      label: 'This Week', 
      icon: Calendar, 
      path: '/todos/week',
      badge: weekCount > 0 ? weekCount : undefined 
    },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarDays, path: '/todos/upcoming' },
    { 
      id: 'overdue', 
      label: 'Overdue', 
      icon: AlertCircle, 
      path: '/todos/overdue',
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive'
    },
    { id: 'by-assignee', label: 'By Assignee', icon: Users, path: '/todos/by-assignee' },
    { id: 'all', label: 'All Tasks', icon: ListTodo, path: '/todos/all' },
  ];

  const isActive = (path: string) => {
    if (path === '/todos') {
      return location.pathname === '/todos';
    }
    return location.pathname === path;
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge !== undefined && (
                              <Badge 
                                variant={item.badgeVariant || 'secondary'}
                                className="h-5 min-w-5 px-1 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
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
            <SidebarMenuButton onClick={onBackToApp} tooltip="Back to BizSuite">
              <ArrowLeft className="h-4 w-4" />
              {sidebarOpen && <span>Back to BizSuite</span>}
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
