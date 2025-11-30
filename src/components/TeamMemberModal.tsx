
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
  const { dispatch, data } = useBusiness();
  const [formData, setFormData] = useState({
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || '',
    businessIds: member?.businessIds || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        businessIds: formData.businessIds,
        paymentHistory: [],
        createdAt: new Date().toISOString()
      };

      dispatch({
        type: 'ADD_TEAM_MEMBER',
        payload: newMember
      });
    } else if (mode === 'edit' && member) {
      dispatch({
        type: 'UPDATE_TEAM_MEMBER',
        payload: { 
          id: member.id, 
          updates: {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            businessIds: formData.businessIds
          }
        }
      });
    }

    onClose();
  };

  const toggleBusiness = (businessId: string) => {
    setFormData(prev => ({
      ...prev,
      businessIds: prev.businessIds.includes(businessId)
        ? prev.businessIds.filter(id => id !== businessId)
        : [...prev.businessIds, businessId]
    }));
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
            {mode === 'create' && 'Add a new team member'}
            {mode === 'edit' && 'Update team member information'}
            {mode === 'view' && 'View team member information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                disabled={isReadOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Enter role"
                disabled={isReadOnly}
                required
              />
            </div>
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

          <div className="space-y-2">
            <Label>Associated Businesses</Label>
            <div className="border rounded-md p-3 space-y-2">
              {data.businesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No businesses available</p>
              ) : (
                data.businesses.map(business => (
                  <div key={business.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`business-${business.id}`}
                      checked={formData.businessIds.includes(business.id)}
                      onChange={() => toggleBusiness(business.id)}
                      disabled={isReadOnly}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`business-${business.id}`} className="text-sm cursor-pointer">
                      {business.name}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Select which businesses this team member belongs to</p>
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
