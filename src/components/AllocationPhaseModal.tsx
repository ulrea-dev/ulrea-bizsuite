import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CurrencyInput } from '@/components/ui/currency-input';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { ProjectAllocation } from '@/types/business';

interface AllocationPhaseModalProps {
  projectId: string;
  allocation?: ProjectAllocation;
  children?: React.ReactNode;
}

export const AllocationPhaseModal: React.FC<AllocationPhaseModalProps> = ({ projectId, allocation, children }) => {
  const { dispatch } = useBusiness();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(allocation?.title || '');
  const [budget, setBudget] = useState(allocation?.budget?.toString() || '');
  const [description, setDescription] = useState(allocation?.description || '');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'on-hold'>(allocation?.status || 'planning');
  const [startDate, setStartDate] = useState<Date | undefined>(
    allocation?.startDate ? new Date(allocation.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    allocation?.endDate ? new Date(allocation.endDate) : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !budget.trim() || !startDate) return;

    const allocationData = {
      id: allocation?.id || generateId(),
      title: title.trim(),
      budget: parseFloat(budget),
      description: description.trim(),
      status,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      createdAt: allocation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (allocation) {
      dispatch({
        type: 'UPDATE_ALLOCATION',
        payload: { projectId, allocationId: allocation.id, updates: allocationData },
      });
    } else {
      dispatch({
        type: 'ADD_ALLOCATION',
        payload: { projectId, allocation: allocationData },
      });
    }

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (!allocation) {
      setTitle('');
      setBudget('');
      setDescription('');
      setStatus('planning');
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {allocation ? 'Edit Allocation' : 'Add New Allocation'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Allocation Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Discovery & Research"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <CurrencyInput
              id="budget"
              value={budget}
              onChange={(value) => setBudget(value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Allocation description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {allocation ? 'Update Allocation' : 'Add Allocation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};