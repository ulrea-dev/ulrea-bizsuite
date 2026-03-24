import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Building2, CheckSquare, X } from 'lucide-react';
import { useTodoReminders } from '@/hooks/useTodoReminders';
import { cn } from '@/lib/utils';

const operationsSubNav = [
  { label: 'Projects', path: '/works/projects' },
  { label: 'Quick Tasks', path: '/works/quick-tasks' },
  { label: 'Retainers', path: '/works/retainers' },
  { label: 'Renewals', path: '/works/renewals' },
  { label: 'Service Types', path: '/works/service-types' },
  { label: 'Revenue', path: '/financials/revenue' },
  { label: 'Payments', path: '/financials/payments' },
  { label: 'Expenses', path: '/financials/expenses' },
  { label: 'Payroll', path: '/financials/salaries' },
  { label: 'Task Payments', path: '/financials/tasks' },
  { label: 'Clients', path: '/clients' },
  { label: 'Analytics', path: '/analytics' },
];

const backOfficeSubNav = [
  { label: 'Overview', path: '/business-management' },
  { label: 'Businesses', path: '/business-management/businesses' },
  { label: 'Access', path: '/business-management/business-access' },
  { label: 'Team', path: '/business-management/team-members' },
  { label: 'Bank Accounts', path: '/business-management/bank-accounts' },
  { label: 'Partners', path: '/business-management/partners' },
  { label: 'Allocations', path: '/business-management/partner-allocations' },
  { label: 'Payables', path: '/business-management/payables' },
  { label: 'Receivables', path: '/business-management/receivables' },
];

const todoSubNav = [
  { label: 'Overview', path: '/todos' },
  { label: 'Today', path: '/todos/today' },
  { label: 'Week', path: '/todos/week' },
  { label: 'Upcoming', path: '/todos/upcoming' },
  { label: 'Overdue', path: '/todos/overdue' },
  { label: 'By Assignee', path: '/todos/by-assignee' },
  { label: 'All', path: '/todos/all' },
];

type TabId = 'home' | 'operations' | 'backoffice' | 'todo';

const tabs: { id: TabId; label: string; icon: typeof Home; path: string; match: string[] }[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard', match: ['/dashboard', '/settings'] },
  { id: 'operations', label: 'Operations', icon: Briefcase, path: '/works', match: ['/works', '/financials', '/clients', '/analytics', '/products', '/sales', '/customers', '/inventory', '/production', '/procurement'] },
  { id: 'backoffice', label: 'Back Office', icon: Building2, path: '/business-management', match: ['/business-management'] },
  { id: 'todo', label: 'To-Do', icon: CheckSquare, path: '/todos', match: ['/todos'] },
];

const subNavMap: Record<string, { label: string; path: string }[]> = {
  operations: operationsSubNav,
  backoffice: backOfficeSubNav,
  todo: todoSubNav,
};

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { overdueCount } = useTodoReminders();
  const [openMenu, setOpenMenu] = useState<TabId | null>(null);

  const activeTab = tabs.find(tab =>
    tab.match.some(m => location.pathname.startsWith(m))
  )?.id || 'home';

  const isSubActive = (path: string) => {
    if (path === '/business-management' || path === '/todos') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.id === 'home') {
      navigate(tab.path);
      setOpenMenu(null);
      return;
    }

    // If tapping the active section tab, toggle the menu
    if (activeTab === tab.id) {
      setOpenMenu(prev => prev === tab.id ? null : tab.id);
    } else {
      // Navigate to the section's default page
      navigate(tab.path);
      setOpenMenu(null);
    }
  };

  const handleSubNavClick = (path: string) => {
    navigate(path);
    setOpenMenu(null);
  };

  const subItems = openMenu ? subNavMap[openMenu] : null;

  return (
    <>
      {/* Overlay + Sub-navigation sheet */}
      {openMenu && subItems && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden animate-in fade-in duration-200"
            onClick={() => setOpenMenu(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="mx-2 mb-[calc(52px+env(safe-area-inset-bottom,0px)+8px)] rounded-2xl border bg-background shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-sm font-semibold text-foreground">
                  {tabs.find(t => t.id === openMenu)?.label}
                </span>
                <button
                  onClick={() => setOpenMenu(null)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 p-2 max-h-[50vh] overflow-y-auto">
                {subItems.map((item) => {
                  const active = isSubActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSubNavClick(item.path)}
                      className={cn(
                        'flex items-center justify-center rounded-xl px-2 py-3 text-xs font-medium transition-all active:scale-95',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="flex items-stretch justify-around border-t bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasMenu = tab.id !== 'home';
            const isMenuOpen = openMenu === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[52px]
                  transition-all duration-150 active:scale-95
                  ${isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                  }
                `}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                  {tab.id === 'todo' && overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {tab.label}
                </span>
                {/* Active section indicator dot for sections with menus */}
                {isActive && hasMenu && (
                  <span className={cn(
                    "absolute bottom-0.5 h-1 w-1 rounded-full transition-colors",
                    isMenuOpen ? "bg-primary" : "bg-primary/50"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
