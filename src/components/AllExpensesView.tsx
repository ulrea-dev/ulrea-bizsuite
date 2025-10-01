import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { Expense } from '@/types/business';
import { Search, Calendar, Briefcase, Receipt, Trash2, MoreHorizontal, Plus, CheckCircle, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ExpenseModal } from './ExpenseModal';

export const AllExpensesView: React.FC = () => {
  const { data, currentBusiness, dispatch } = useBusiness();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a business to view expenses.</p>
      </div>
    );
  }

  // Get all expenses from all projects in this business
  const allExpenses: (Expense & { projectName?: string })[] = data.projects
    .filter(project => project.businessId === currentBusiness.id)
    .flatMap(project => 
      project.expenses.map(expense => ({
        ...expense,
        projectName: project.name,
      }))
    );

  // Apply filters
  const filteredExpenses = allExpenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
    const matchesProject = filterProject === 'all' || expense.projectId === filterProject;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesProject;
  });

  // Sort by date (newest first)
  const sortedExpenses = filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidAmount = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, expense) => sum + expense.amount, 0);
  const pendingAmount = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0);

  // Get unique projects for filter dropdown
  const projects = data.projects.filter(p => p.businessId === currentBusiness.id);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      software: 'bg-blue-100 text-blue-800 border-blue-200',
      equipment: 'bg-purple-100 text-purple-800 border-purple-200',
      marketing: 'bg-pink-100 text-pink-800 border-pink-200',
      travel: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      contractor: 'bg-orange-100 text-orange-800 border-orange-200',
      supplies: 'bg-green-100 text-green-800 border-green-200',
      hosting: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      services: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[category] || colors.other;
  };

  const handleDeleteExpense = (expense: Expense) => {
    dispatch({
      type: 'DELETE_EXPENSE',
      payload: expense.id
    });
    toast({
      title: "Expense Deleted",
      description: `${expense.name} has been deleted.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExpenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(pendingAmount, currentBusiness.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Management</CardTitle>
              <CardDescription>
                View and manage all expenses across projects
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search expenses, projects, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="software">Software & Tools</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="hosting">Hosting</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expenses List */}
          <div className="space-y-3">
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found matching your criteria.
              </div>
            ) : (
              sortedExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{expense.name}</span>
                        <Badge variant="outline" className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                        <Badge variant={expense.status === 'paid' ? 'default' : 'secondary'}>
                          {expense.status === 'paid' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {expense.projectName && (
                          <div className="flex items-center gap-1 mb-1">
                            <Briefcase className="h-3 w-3" />
                            <span className="font-medium">Project:</span> {expense.projectName}
                          </div>
                        )}
                        {expense.description && (
                          <div>{expense.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(expense.amount, currentBusiness.currency)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Expense
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the expense "{expense.name}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExpense(expense)}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {isAddingExpense && projects.length > 0 && (
        <ExpenseModal
          isOpen={isAddingExpense}
          onClose={() => setIsAddingExpense(false)}
          projectId={projects[0].id}
          mode="create"
        />
      )}
    </div>
  );
};
