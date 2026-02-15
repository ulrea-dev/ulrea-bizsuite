import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, TrendingUp, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { BulkTodoModal } from './BulkTodoModal';
import { TodoItem } from './TodoItem';
import { format, startOfWeek, endOfWeek, isToday } from 'date-fns';

export const TodoOverview: React.FC = () => {
  const { data } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const stats = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0];

    const pending = todos.filter(t => t.status === 'pending');
    const completedToday = todos.filter(
      t => t.status === 'done' && t.completedAt && isToday(new Date(t.completedAt))
    );

    const overdue = pending.filter(t => t.dueDate < today);
    const dueToday = pending.filter(t => t.dueDate === today);
    const dueThisWeek = pending.filter(t => t.dueDate >= weekStart && t.dueDate <= weekEnd);

    // Calculate completion rate for the week
    const weekTodos = todos.filter(t => t.dueDate >= weekStart && t.dueDate <= weekEnd);
    const weekCompleted = weekTodos.filter(t => t.status === 'done').length;
    const completionRate = weekTodos.length > 0 ? Math.round((weekCompleted / weekTodos.length) * 100) : 0;

    return {
      overdue: overdue.length,
      dueToday: dueToday.length,
      dueThisWeek: dueThisWeek.length,
      completedToday: completedToday.length,
      completionRate,
      todayTasks: [...overdue, ...dueToday].slice(0, 5),
      upcomingTasks: pending
        .filter(t => t.dueDate > today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
    };
  }, [data.todos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">To-Do Overview</h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
            <ListPlus className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={stats.overdue > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-destructive' : ''}`}>
              {stats.overdue}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.dueToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Week Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks & Upcoming */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.todayTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No tasks due today! 🎉
              </p>
            ) : (
              stats.todayTasks.map((todo) => (
                <TodoItem key={todo.id} todo={todo} compact />
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.upcomingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No upcoming tasks scheduled.
              </p>
            ) : (
              stats.upcomingTasks.map((todo) => (
                <TodoItem key={todo.id} todo={todo} compact showDate />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <BulkTodoModal open={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
    </div>
  );
};
