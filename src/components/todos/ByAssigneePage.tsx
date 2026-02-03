import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusiness } from '@/contexts/BusinessContext';
import { TodoModal } from '@/components/TodoModal';
import { TodoItem } from './TodoItem';
import { ToDoAssigneeType, ToDo } from '@/types/business';
import { migrateTodoAssignees } from '@/utils/todoMigration';

export const ByAssigneePage: React.FC = () => {
  const { data } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ToDoAssigneeType | 'all'>('all');

  const today = new Date().toISOString().split('T')[0];

  const { tasksByAssignee, stats } = useMemo(() => {
    const todos = (data.todos || []).map(migrateTodoAssignees);
    const pending = todos.filter(t => t.status === 'pending');

    // Helper to check if a todo has an assignee of a specific type
    const hasAssigneeType = (todo: ToDo, type: ToDoAssigneeType) => {
      return todo.assignees?.some(a => a.type === type) || false;
    };

    // Group by assignee type - a task can appear in multiple groups if it has multiple assignee types
    const byType: Record<ToDoAssigneeType, ToDo[]> = {
      self: pending.filter(t => hasAssigneeType(t, 'self')),
      operator: pending.filter(t => hasAssigneeType(t, 'operator')),
      'team-member': pending.filter(t => hasAssigneeType(t, 'team-member')),
      partner: pending.filter(t => hasAssigneeType(t, 'partner')),
    };

    // Calculate stats
    const calcStats = (tasks: ToDo[]) => ({
      total: tasks.length,
      overdue: tasks.filter(t => t.dueDate < today).length,
      dueToday: tasks.filter(t => t.dueDate === today).length,
    });

    return {
      tasksByAssignee: byType,
      stats: {
        self: calcStats(byType.self),
        operator: calcStats(byType.operator),
        'team-member': calcStats(byType['team-member']),
        partner: calcStats(byType.partner),
      },
    };
  }, [data.todos, today]);

  // Get unique assignees for detailed view
  const assigneeDetails = useMemo(() => {
    const todos = (data.todos || []).map(migrateTodoAssignees);
    const pending = todos.filter(t => t.status === 'pending');
    
    const details: Record<string, { name: string; type: ToDoAssigneeType; tasks: ToDo[] }> = {};
    
    pending.forEach(todo => {
      const assignees = todo.assignees || [];
      assignees.forEach(assignee => {
        const key = `${assignee.type}-${assignee.id}`;
        if (!details[key]) {
          details[key] = {
            name: assignee.name,
            type: assignee.type,
            tasks: [],
          };
        }
        details[key].tasks.push(todo);
      });
    });

    return Object.entries(details).sort((a, b) => b[1].tasks.length - a[1].tasks.length);
  }, [data.todos]);

  const getDisplayTasks = () => {
    if (activeTab === 'all') {
      return [...tasksByAssignee.self, ...tasksByAssignee.operator, ...tasksByAssignee['team-member'], ...tasksByAssignee.partner];
    }
    return tasksByAssignee[activeTab];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks by Assignee</h1>
          <p className="text-muted-foreground">
            View workload distribution
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${activeTab === 'self' ? 'border-primary' : ''}`}
          onClick={() => setActiveTab('self')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Self</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.self.total}</p>
            {stats.self.overdue > 0 && (
              <p className="text-xs text-destructive">{stats.self.overdue} overdue</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${activeTab === 'operator' ? 'border-primary' : ''}`}
          onClick={() => setActiveTab('operator')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.operator.total}</p>
            {stats.operator.overdue > 0 && (
              <p className="text-xs text-destructive">{stats.operator.overdue} overdue</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${activeTab === 'team-member' ? 'border-primary' : ''}`}
          onClick={() => setActiveTab('team-member')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats['team-member'].total}</p>
            {stats['team-member'].overdue > 0 && (
              <p className="text-xs text-destructive">{stats['team-member'].overdue} overdue</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${activeTab === 'partner' ? 'border-primary' : ''}`}
          onClick={() => setActiveTab('partner')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.partner.total}</p>
            {stats.partner.overdue > 0 && (
              <p className="text-xs text-destructive">{stats.partner.overdue} overdue</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ToDoAssigneeType | 'all')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="self">Self</TabsTrigger>
          <TabsTrigger value="operator">Operators</TabsTrigger>
          <TabsTrigger value="team-member">Team</TabsTrigger>
          <TabsTrigger value="partner">Partners</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {getDisplayTasks().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium">No tasks</h3>
              <p className="text-muted-foreground">
                No tasks assigned to {activeTab === 'all' ? 'anyone' : activeTab.replace('-', ' ')}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {getDisplayTasks()
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((todo) => (
                  <TodoItem key={todo.id} todo={todo} showDate />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TodoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
