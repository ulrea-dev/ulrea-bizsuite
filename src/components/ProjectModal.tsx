
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { Project } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency } from '@/utils/storage';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  mode: 'create' | 'edit' | 'view';
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, project, mode }) => {
  const { currentBusiness, addProject, updateProject } = useBusiness();
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    totalValue: project?.totalValue?.toString() || '',
    status: project?.status || 'active' as Project['status'],
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    endDate: project?.endDate || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    const projectData = {
      businessId: currentBusiness.id,
      name: formData.name,
      description: formData.description,
      totalValue: parseFloat(formData.totalValue),
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      teamAllocations: project?.teamAllocations || []
    };

    if (mode === 'create') {
      addProject(projectData);
    } else if (mode === 'edit' && project) {
      updateProject(project.id, projectData);
    }

    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
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
              <Input
                id="totalValue"
                type="number"
                value={formData.totalValue}
                onChange={(e) => setFormData(prev => ({ ...prev, totalValue: e.target.value }))}
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
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              disabled={isReadOnly}
            />
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
                      project.teamAllocations.reduce((sum, alloc) => sum + alloc.totalAllocated, 0),
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
  );
};
