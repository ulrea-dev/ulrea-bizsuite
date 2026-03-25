import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTodoReminders } from '@/hooks/useTodoReminders';
import { Briefcase, Settings2, ListTodo, ArrowRight, FolderKanban, ListChecks, Repeat, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/storage';

export const WorkOSHub: React.FC = () => {
  const navigate = useNavigate();
  const { data, currentBusiness, isLoadingFromDB } = useBusiness();
  const { overdueCount, dueTodayCount } = useTodoReminders();

  // All hooks must be called before any conditional returns
  const recentWorks = useMemo(() => {
    if (!currentBusiness) return [];
    const projects = data.projects
      .filter(p => p.businessId === currentBusiness.id && p.status === 'active')
      .map(p => ({ type: 'project' as const, id: p.id, name: p.name, value: p.totalValue, date: p.updatedAt || p.createdAt }));
    const tasks = (data.quickTasks || [])
      .filter(t => t.businessId === currentBusiness.id && (t.status === 'active' || t.status === 'pending'))
      .map(t => ({ type: 'task' as const, id: t.id, name: t.title, value: t.amount, date: t.updatedAt || t.createdAt }));
    const retainers = (data.retainers || [])
      .filter(r => r.businessId === currentBusiness.id && r.status === 'active')
      .map(r => ({ type: 'retainer' as const, id: r.id, name: r.name, value: r.amount, date: r.updatedAt || r.createdAt }));
    return [...projects, ...tasks, ...retainers]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [data, currentBusiness]);

  const upcomingTodos = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(t => t.status === 'pending' && t.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  }, [data.todos]);

  const overdueTodos = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    return todos.filter(t => t.status === 'pending' && t.dueDate < today)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate)).slice(0, 3);
  }, [data.todos]);

  const activeProjectsCount = currentBusiness
    ? data.projects.filter(p => p.businessId === currentBusiness.id && p.status === 'active').length
    : data.projects.filter(p => p.status === 'active').length;

  const teamCount = data.teamMembers?.length || 0;

  // After all hooks: show legacy onboarding if no ventures exist
  if (!isLoadingFromDB && data.businesses.length === 0) {
    return <LegacyOnboardingFlow onComplete={() => { /* importData triggers re-render */ }} />;
  }

  const getWorkIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderKanban className="h-3.5 w-3.5" />;
      case 'task': return <ListChecks className="h-3.5 w-3.5" />;
      case 'retainer': return <Repeat className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const handleWorkClick = (work: { type: string; id: string }) => {
    switch (work.type) {
      case 'project': navigate(`/works/projects/${work.id}`); break;
      case 'task': navigate('/works/quick-tasks'); break;
      case 'retainer': navigate(`/works/retainers/${work.id}`); break;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 sm:py-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {data.userSettings.username
            ? `Welcome back, ${data.userSettings.username}`
            : currentBusiness
              ? `Welcome to ${currentBusiness.name}`
              : 'Welcome'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate(currentBusiness ? '/works/projects' : '/dashboard')}
          className="group flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all"
        >
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Operations</span>
          <span className="text-xs text-muted-foreground">{activeProjectsCount} active</span>
        </button>

        <button
          onClick={() => navigate('/business-management')}
          className="group flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all"
        >
          <div className="p-2.5 rounded-lg bg-secondary">
            <Settings2 className="h-5 w-5 text-secondary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Back Office</span>
          <span className="text-xs text-muted-foreground">{teamCount} team</span>
        </button>

        <button
          onClick={() => navigate('/todos')}
          className="group flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all relative"
        >
          <div className="p-2.5 rounded-lg bg-accent">
            <ListTodo className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">To-Do</span>
          <span className="text-xs text-muted-foreground">
            {overdueCount > 0 ? `${overdueCount} overdue` : `${dueTodayCount} today`}
          </span>
          {overdueCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>

      {/* Two-column summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tasks</h2>
            <button onClick={() => navigate('/todos/today')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {overdueTodos.length > 0 && (
            <div className="space-y-1.5">
              {overdueTodos.map(todo => (
                <div key={todo.id} onClick={() => navigate('/todos/overdue')}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{todo.title}</span>
                  <span className="text-xs text-destructive shrink-0">Overdue</span>
                </div>
              ))}
            </div>
          )}

          {upcomingTodos.length > 0 ? (
            <div className="space-y-1.5">
              {upcomingTodos.map(todo => (
                <div key={todo.id} onClick={() => navigate('/todos/today')}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{todo.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : overdueTodos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming tasks</p>
          ) : null}
        </div>

        {/* Recent works */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Recent Works</h2>
            <button onClick={() => navigate('/works/projects')} className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recentWorks.length > 0 ? (
            <div className="space-y-1.5">
              {recentWorks.map(work => (
                <div key={`${work.type}-${work.id}`} onClick={() => handleWorkClick(work)}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="text-muted-foreground shrink-0">{getWorkIcon(work.type)}</div>
                  <span className="text-sm text-foreground truncate flex-1">{work.name}</span>
                  {currentBusiness && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatCurrency(work.value, currentBusiness.currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No active works</p>
          )}
        </div>
      </div>
    </div>
  );
};
