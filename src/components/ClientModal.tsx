
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  mode: 'create' | 'edit' | 'view';
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client, mode }) => {
  const { dispatch } = useBusiness();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    company: client?.company || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newClient: Client = {
        id: `client_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        projects: [],
        totalValue: 0,
        createdAt: new Date().toISOString()
      };

      dispatch({
        type: 'ADD_CLIENT',
        payload: newClient
      });
    } else if (mode === 'edit' && client) {
      dispatch({
        type: 'UPDATE_CLIENT',
        payload: { 
          id: client.id, 
          updates: {
            name: formData.name,
            email: formData.email,
            company: formData.company
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
            {mode === 'create' && 'Add Client'}
            {mode === 'edit' && 'Edit Client'}
            {mode === 'view' && 'Client Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Add a new client to your business'}
            {mode === 'edit' && 'Update client information'}
            {mode === 'view' && 'View client information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter client name"
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

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Enter company name"
              disabled={isReadOnly}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit">
                {mode === 'create' ? 'Add Client' : 'Update Client'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
