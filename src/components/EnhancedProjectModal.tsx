import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, CalendarIcon } from 'lucide-react';
import { Project } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';
import { ClientModal } from './ClientModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  mode: 'create' | 'edit' | 'view';
}

export const EnhancedProjectModal: React.FC<EnhancedProjectModalProps> = ({ isOpen, onClose, project, mode }) => {
  const { data, currentBusiness, addProject, updateProject } = useBusiness();
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    totalValue: project?.totalValue?.toString() || '',
    status: project?.status || 'active' as Project['status'],
    clientId: project?.clientId || ''
  });

  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.startDate ? new Date(project.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.endDate ? new Date(project.endDate) : undefined
  );

  const clients = data.clients || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    const projectData = {
      businessId: currentBusiness.id,
      name: formData.name,
      description: formData.description,
      totalValue: parseFloat(formData.totalValue),
      status: formData.status,
      startDate: startDate?.toISOString() || new Date().toISOString(),
      endDate: endDate?.toISOString(),
      clientId: formData.clientId || undefined,
      isMultiPhase: project?.isMultiPhase || false,
      allocations: project?.allocations || [],
      teamAllocations: project?.teamAllocations || [],
      partnerAllocations: project?.partnerAllocations || [],
      companyAllocation: project?.companyAllocation,
      allocationTeamAllocations: project?.allocationTeamAllocations || [],
      allocationPartnerAllocations: project?.allocationPartnerAllocations || [],
      allocationCompanyAllocations: project?.allocationCompanyAllocations || [],
      clientPayments: project?.clientPayments || 0,
      expenses: project?.expenses || []
    };

    if (mode === 'create') {
      addProject(projectData);
    } else if (mode === 'edit' && project) {
      updateProject(project.id, projectData);
    }

    onClose();
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const isReadOnly = mode === 'view';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' && 'Create New Project'}
              {mode === 'edit' && 'Edit Project'}
              {mode === 'view' && 'Project Details'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' && 'Add a new project to your business'}
              {mode === 'edit' && 'Update project information'}
              {mode === 'view' && 'View project information'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                  disabled={isReadOnly}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalValue">Total Value</Label>
                <CurrencyInput
                  id="totalValue"
                  value={formData.totalValue}
                  onChange={(value) => setFormData(prev => ({ ...prev, totalValue: value }))}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project..."
                disabled={isReadOnly}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">Client</Label>
                {!isReadOnly && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setClientModalOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Client
                  </Button>
                )}
              </div>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient && (
                <div className="text-sm dashboard-text-secondary">
                  {selectedClient.email}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Project['status']) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                      disabled={isReadOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {project && currentBusiness && (
              <div className="p-4 dashboard-surface-elevated rounded-lg">
                <h4 className="font-semibold mb-2">Financial Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="dashboard-text-secondary">Project Value:</span>
                    <div className="font-semibold">
                      {formatCurrency(project.totalValue, currentBusiness.currency)}
                    </div>
                  </div>
                  <div>
                    <span className="dashboard-text-secondary">Team Allocated:</span>
                    <div className="font-semibold">
                      {formatCurrency(
                        project.teamAllocations?.reduce((sum, alloc) => sum + alloc.totalAllocated, 0) || 0,
                        currentBusiness.currency
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>
              {!isReadOnly && (
                <Button type="submit">
                  {mode === 'create' ? 'Create Project' : 'Update Project'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        mode="create"
      />
    </>
  );
};