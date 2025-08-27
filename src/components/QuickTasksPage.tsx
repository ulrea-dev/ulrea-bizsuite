import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickTaskModal } from './QuickTaskModal';
import { useBusiness } from '@/contexts/BusinessContext';
import { QuickTask } from '@/types/business';
import { formatCurrency } from '@/utils/storage';
import { Plus, ListChecks, Clock, CheckCircle, DollarSign, Calendar, User, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickTasksPageProps {
  onNavigateToPage: (page: string) => void;
}

export const QuickTasksPage: React.FC<QuickTasksPageProps> = ({ onNavigateToPage }) => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<QuickTask | null>(null);

  if (!currentBusiness) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select a business to manage quick tasks.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const businessTasks = data.quickTasks?.filter(task => task.businessId === currentBusiness.id) || [];
  const today = new Date();

  // Calculate stats
  const activeTasks = businessTasks.filter(task => task.status === 'active');
  const pendingTasks = businessTasks.filter(task => task.status === 'pending');
  const completedTasks = businessTasks.filter(task => task.status === 'completed');
  const overdueTasks = businessTasks.filter(task => 
    (task.status === 'active' || task.status === 'pending') && task.dueDate && new Date(task.dueDate) < today
  );

  const totalPendingAmount = businessTasks
    .filter(task => task.status !== 'completed')
    .reduce((sum, task) => sum + task.amount, 0);

  const handleEditTask = (task: QuickTask) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task: QuickTask) => {
    dispatch({
      type: 'DELETE_QUICK_TASK',
      payload: task.id
    });
    toast({
      title: "Task Deleted",
      description: `Quick task "${task.title}" has been deleted.`,
    });
  };

  const handleMarkCompleted = (task: QuickTask) => {
    dispatch({
      type: 'COMPLETE_QUICK_TASK',
      payload: { id: task.id, paidAt: new Date().toISOString() }
    });
    toast({
      title: "Task Completed",
      description: `Task "${task.title}" has been marked as completed.`,
    });
  };

  const getStatusBadge = (task: QuickTask) => {
    if (task.status === 'completed') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    }
    if (task.dueDate && new Date(task.dueDate) < today && (task.status === 'active' || task.status === 'pending')) {
      return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Overdue</Badge>;
    }
    if (task.status === 'active') {
      return <Badge variant="default"><ListChecks className="h-3 w-3 mr-1" />Active</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const getAssigneeName = (assignedToId: string) => {
    const member = data.teamMembers.find(m => m.id === assignedToId);
    return member?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quick Tasks</h1>
          <p className="text-muted-foreground">Manage one-time tasks and payments for {currentBusiness.name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigateToPage('salaries')} variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            Go to Salaries to Pay
          </Button>
          <Button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            New Quick Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <ListChecks className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeTasks.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalPendingAmount, currentBusiness.currency)}
                </p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            {businessTasks.length} total tasks • {businessTasks.filter(t => t.status !== 'completed').length} pending payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {businessTasks.length === 0 ? (
            <div className="text-center py-8">
              <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No quick tasks yet</p>
              <p className="text-muted-foreground mb-4">Create your first quick task to get started.</p>
              <Button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {businessTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(task)}
                        <span className="font-medium">
                          {task.currencyCode === currentBusiness.currency.code 
                            ? formatCurrency(task.amount, currentBusiness.currency)
                            : `${task.amount.toFixed(2)} ${task.currencyCode}`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getAssigneeName(task.assignedToId)}
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {task.taskType && (
                        <Badge variant="outline" className="text-xs">
                          {task.taskType}
                        </Badge>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {task.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onNavigateToPage('salaries')}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Pay
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        {task.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleMarkCompleted(task)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </DropdownMenuItem>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <QuickTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </div>
  );
};