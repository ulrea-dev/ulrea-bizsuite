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
import { ProjectPhase } from '@/types/business';

interface PhaseModalProps {
  projectId: string;
  phase?: ProjectPhase;
  children?: React.ReactNode;
}

export const PhaseModal: React.FC<PhaseModalProps> = ({ projectId, phase, children }) => {
  const { dispatch } = useBusiness();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(phase?.title || '');
  const [budget, setBudget] = useState(phase?.budget?.toString() || '');
  const [description, setDescription] = useState(phase?.description || '');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'on-hold'>(phase?.status || 'planning');
  const [startDate, setStartDate] = useState<Date | undefined>(
    phase?.startDate ? new Date(phase.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    phase?.endDate ? new Date(phase.endDate) : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !budget.trim() || !startDate) return;

    const phaseData = {
      id: phase?.id || generateId(),
      title: title.trim(),
      budget: parseFloat(budget),
      description: description.trim(),
      status,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      createdAt: phase?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (phase) {
      dispatch({
        type: 'UPDATE_PHASE',
        payload: { projectId, phaseId: phase.id, updates: phaseData },
      });
    } else {
      dispatch({
        type: 'ADD_PHASE',
        payload: { projectId, phase: phaseData },
      });
    }

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (!phase) {
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
            Add Phase
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {phase ? 'Edit Phase' : 'Add New Phase'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Phase Title</Label>
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
              placeholder="Phase description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {phase ? 'Update Phase' : 'Add Phase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};