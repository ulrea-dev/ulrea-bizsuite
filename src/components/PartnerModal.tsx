import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Partner } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: Partner | null;
  mode: 'create' | 'edit' | 'view';
}

export const PartnerModal: React.FC<PartnerModalProps> = ({ isOpen, onClose, partner, mode }) => {
  const { dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    email: partner?.email || '',
    type: partner?.type || 'sales' as Partner['type']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newPartner: Partner = {
        id: `partner_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        type: formData.type,
        paymentHistory: [],
        createdAt: new Date().toISOString()
      };

      dispatch({
        type: 'ADD_PARTNER',
        payload: newPartner
      });
    } else if (mode === 'edit' && partner) {
      dispatch({
        type: 'UPDATE_PARTNER',
        payload: { 
          id: partner.id, 
          updates: {
            name: formData.name,
            email: formData.email,
            type: formData.type
          }
        }
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
            {mode === 'create' && 'Add Partner'}
            {mode === 'edit' && 'Edit Partner'}
            {mode === 'view' && 'Partner Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Add a new business partner'}
            {mode === 'edit' && 'Update partner information'}
            {mode === 'view' && 'View partner information'}
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
              <Label htmlFor="type">Partner Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Partner['type']) => setFormData(prev => ({ ...prev, type: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Partner</SelectItem>
                  <SelectItem value="managing">Managing Partner</SelectItem>
                </SelectContent>
              </Select>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === 'create' ? 'Add Partner' : 'Update Partner'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};