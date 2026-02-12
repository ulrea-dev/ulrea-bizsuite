import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Building2, CheckSquare } from 'lucide-react';
import { useTodoReminders } from '@/hooks/useTodoReminders';

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard', match: ['/dashboard', '/settings'] },
  { id: 'operations', label: 'Operations', icon: Briefcase, path: '/works', match: ['/works'] },
  { id: 'backoffice', label: 'Back Office', icon: Building2, path: '/admin', match: ['/admin'] },
  { id: 'todo', label: 'To-Do', icon: CheckSquare, path: '/todos', match: ['/todos'] },
];

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { overdueCount } = useTodoReminders();

  const activeTab = tabs.find(tab => 
    tab.match.some(m => location.pathname.startsWith(m))
  )?.id || 'home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-stretch justify-around border-t bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
};
