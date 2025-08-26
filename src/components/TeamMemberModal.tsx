
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeamMember } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: TeamMember | null;
  mode: 'create' | 'edit' | 'view';
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, member, mode }) => {
  const { dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || '',
    defaultRate: member?.defaultRate?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberData: Omit<TeamMember, 'id' | 'createdAt' | 'paymentHistory'> = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      defaultRate: parseFloat(formData.defaultRate),
      paymentHistory: member?.paymentHistory || []
    };

    if (mode === 'create') {
      dispatch({
        type: 'ADD_TEAM_MEMBER',
        payload: {
          ...memberData,
          id: `member_${Date.now()}`,
          createdAt: new Date().toISOString()
        }
      });
    } else if (mode === 'edit' && member) {
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: { id: member.id, updates: memberData }
      });
    }

    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Add Team Member'}
            {mode === 'edit' && 'Edit Team Member'}
            {mode === 'view' && 'Team Member Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Add a new team member to your organization'}
            {mode === 'edit' && 'Update team member information'}
            {mode === 'view' && 'View team member information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Developer, Designer"
                disabled={isReadOnly}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultRate">Default Rate</Label>
              <Input
                id="defaultRate"
                type="number"
                value={formData.defaultRate}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultRate: e.target.value }))}
                placeholder="0.00"
                disabled={isReadOnly}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === 'create' ? 'Add Member' : 'Update Member'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
