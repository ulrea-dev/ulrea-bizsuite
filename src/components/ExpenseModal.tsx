
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useBusiness } from '@/contexts/BusinessContext';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types/business';
import { generateId } from '@/utils/storage';
import { cn } from '@/lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  retainerId?: string;
  memberId?: string;
  partnerId?: string;
  taskId?: string;
  expense?: Expense;
  mode: 'create' | 'edit' | 'view';
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  projectId,
  retainerId,
  memberId,
  partnerId,
  taskId,
  expense,
  mode
}) => {
  const { dispatch, currentBusiness, data } = useBusiness();
  const [expenseType, setExpenseType] = useState<'project' | 'retainer' | 'team' | 'partner' | 'task' | 'business'>('business');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as ExpenseCategory,
    amount: '',
    date: new Date(),
    description: '',
    status: 'pending' as 'pending' | 'paid',
    isRecurring: false,
    recurringFrequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    recurringEndDate: undefined as Date | undefined,
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        category: expense.category,
        amount: expense.amount.toString(),
        date: new Date(expense.date),
        description: expense.description || '',
        status: expense.status,
        isRecurring: expense.isRecurring || false,
        recurringFrequency: expense.recurringFrequency || 'monthly',
        recurringEndDate: expense.recurringEndDate ? new Date(expense.recurringEndDate) : undefined,
      });
      
      // Set expense type based on what's set
      if (expense.projectId) {
        setExpenseType('project');
        setSelectedEntityId(expense.projectId);
      } else if (expense.retainerId) {
        setExpenseType('retainer');
        setSelectedEntityId(expense.retainerId);
      } else if (expense.memberId) {
        setExpenseType('team');
        setSelectedEntityId(expense.memberId);
      } else if (expense.partnerId) {
        setExpenseType('partner');
        setSelectedEntityId(expense.partnerId);
      } else if (expense.taskId) {
        setExpenseType('task');
        setSelectedEntityId(expense.taskId);
      } else {
        setExpenseType('business');
      }
    } else {
      // Set initial expense type based on props
      if (projectId) {
        setExpenseType('project');
        setSelectedEntityId(projectId);
      } else if (retainerId) {
        setExpenseType('retainer');
        setSelectedEntityId(retainerId);
      } else if (memberId) {
        setExpenseType('team');
        setSelectedEntityId(memberId);
      } else if (partnerId) {
        setExpenseType('partner');
        setSelectedEntityId(partnerId);
      } else if (taskId) {
        setExpenseType('task');
        setSelectedEntityId(taskId);
      }
      
      setFormData({
        name: '',
        category: 'other',
        amount: '',
        date: new Date(),
        description: '',
        status: 'pending',
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: undefined,
      });
    }
  }, [expense, projectId, retainerId, memberId, partnerId, taskId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount) {
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    if (mode === 'create') {
      const newExpense: Expense = {
        id: generateId(),
        businessId: currentBusiness?.id || '',
        projectId: expenseType === 'project' ? selectedEntityId : undefined,
        retainerId: expenseType === 'retainer' ? selectedEntityId : undefined,
        memberId: expenseType === 'team' ? selectedEntityId : undefined,
        partnerId: expenseType === 'partner' ? selectedEntityId : undefined,
        taskId: expenseType === 'task' ? selectedEntityId : undefined,
        name: formData.name.trim(),
        category: formData.category,
        amount,
        date: formData.date.toISOString(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate.toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    } else if (mode === 'edit' && expense) {
      const updates: Partial<Expense> = {
        projectId: expenseType === 'project' ? selectedEntityId : undefined,
        retainerId: expenseType === 'retainer' ? selectedEntityId : undefined,
        memberId: expenseType === 'team' ? selectedEntityId : undefined,
        partnerId: expenseType === 'partner' ? selectedEntityId : undefined,
        taskId: expenseType === 'task' ? selectedEntityId : undefined,
        name: formData.name.trim(),
        category: formData.category,
        amount,
        date: formData.date.toISOString(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate.toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ 
        type: 'UPDATE_EXPENSE', 
        payload: { id: expense.id, updates } 
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (expense && confirm('Are you sure you want to delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: expense.id });
      onClose();
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Expense' : 
             mode === 'edit' ? 'Edit Expense' : 'Expense Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expense Type Selector */}
          {!expense && (
            <div className="space-y-2">
              <Label>Expense Type</Label>
              <Select
                value={expenseType}
                onValueChange={(value: any) => {
                  setExpenseType(value);
                  setSelectedEntityId('');
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Expense</SelectItem>
                  <SelectItem value="project">Project Expense</SelectItem>
                  <SelectItem value="retainer">Retainer Expense</SelectItem>
                  <SelectItem value="team">Team Member Expense</SelectItem>
                  <SelectItem value="partner">Partner Expense</SelectItem>
                  <SelectItem value="task">Quick Task Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Entity Selector */}
          {expenseType !== 'business' && !expense && (
            <div className="space-y-2">
              <Label>
                {expenseType === 'project' && 'Select Project'}
                {expenseType === 'retainer' && 'Select Retainer'}
                {expenseType === 'team' && 'Select Team Member'}
                {expenseType === 'partner' && 'Select Partner'}
                {expenseType === 'task' && 'Select Quick Task'}
              </Label>
              <Select
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${expenseType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {expenseType === 'project' && data.projects
                    .filter(p => p.businessId === currentBusiness?.id)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  {expenseType === 'retainer' && data.retainers
                    .filter(r => r.businessId === currentBusiness?.id)
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  {expenseType === 'team' && data.teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                  {expenseType === 'partner' && data.partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {expenseType === 'task' && data.quickTasks
                    .filter(t => t.businessId === currentBusiness?.id)
                    .map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.description}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter expense name"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: ExpenseCategory) => 
                setFormData({ ...formData, category: value })
              }
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                disabled={isReadOnly}
                required
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, date });
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'pending' | 'paid') => 
                setFormData({ ...formData, status: value })
              }
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter expense description"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Recurring Expense Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                disabled={isReadOnly}
                className="rounded"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                Make this expense recurring
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.recurringFrequency}
                    onValueChange={(value: any) => 
                      setFormData({ ...formData, recurringFrequency: value })
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.recurringEndDate && "text-muted-foreground"
                        )}
                        disabled={isReadOnly}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.recurringEndDate ? format(formData.recurringEndDate, "PPP") : "No end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.recurringEndDate}
                        onSelect={(date) => {
                          setFormData({ ...formData, recurringEndDate: date });
                          setEndDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {mode === 'view' ? (
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                {mode === 'edit' && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                )}
                <Button type="submit">
                  {mode === 'create' ? 'Add Expense' : 'Update Expense'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
