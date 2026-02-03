import { useState, useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { addDays } from 'date-fns';

export const useTodoReminders = () => {
  const { data, currentBusiness } = useBusiness();
  const [dismissed, setDismissed] = useState(false);

  const stats = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];
    
    // Filter to pending tasks, optionally by current business
    const pending = todos.filter(t => {
      if (t.status !== 'pending') return false;
      // If no business context or task has no businessId, include it
      if (!currentBusiness || !t.businessId) return true;
      return t.businessId === currentBusiness.id;
    });
    
    const overdue = pending.filter(t => t.dueDate < today);
    const dueToday = pending.filter(t => t.dueDate === today);
    const dueTomorrow = pending.filter(t => t.dueDate === tomorrow);
    
    // Get high priority tasks (high or urgent) due within a week
    const nextWeek = addDays(new Date(), 7).toISOString().split('T')[0];
    const highPriorityUpcoming = pending.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && 
      t.dueDate <= nextWeek && 
      t.dueDate >= today
    );
    
    return { 
      overdue, 
      dueToday, 
      dueTomorrow,
      highPriorityUpcoming,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
      dueTomorrowCount: dueTomorrow.length,
      totalUrgent: overdue.length + dueToday.length,
    };
  }, [data.todos, currentBusiness]);

  const shouldShowReminder = stats.totalUrgent > 0 && !dismissed;

  return {
    ...stats,
    shouldShowReminder,
    dismissReminder: () => setDismissed(true),
  };
};
