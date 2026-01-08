import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Partner } from '@/types/business';
import { useBusiness } from '@/contexts/BusinessContext';
import { Badge } from '@/components/ui/badge';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: Partner | null;
  mode: 'create' | 'edit' | 'view';
}

export const PartnerModal: React.FC<PartnerModalProps> = ({ isOpen, onClose, partner, mode }) => {
  const { dispatch, data, currentBusiness } = useBusiness();
  const businesses = data.businesses || [];
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'sales' as Partner['type'],
    businessIds: [] as string[]
  });

  // Reset form when modal opens or partner changes
  useEffect(() => {
    if (isOpen) {
      if (partner) {
        setFormData({
          name: partner.name || '',
          email: partner.email || '',
          type: partner.type || 'sales',
          businessIds: partner.businessIds || []
        });
      } else {
        // Default to current business for new partners
        setFormData({
          name: '',
          email: '',
          type: 'sales',
          businessIds: currentBusiness ? [currentBusiness.id] : []
        });
      }
    }
  }, [isOpen, partner, currentBusiness]);

  const handleBusinessToggle = (businessId: string) => {
    setFormData(prev => ({
      ...prev,
      businessIds: prev.businessIds.includes(businessId)
        ? prev.businessIds.filter(id => id !== businessId)
        : [...prev.businessIds, businessId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const newPartner: Partner = {
        id: `partner_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        type: formData.type,
        businessIds: formData.businessIds,
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
            type: formData.type,
            businessIds: formData.businessIds
          }
        }
      });
    }

    onClose();
  };

  const isReadOnly = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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

          <div className="space-y-2">
            <Label>Associated Businesses</Label>
            <p className="text-xs text-muted-foreground">
              Select which businesses this partner can access
            </p>
            
            {isReadOnly ? (
              <div className="flex flex-wrap gap-2">
                {formData.businessIds.length > 0 ? (
                  formData.businessIds.map(id => {
                    const business = businesses.find(b => b.id === id);
                    return business ? (
                      <Badge key={id} variant="secondary">
                        {business.name}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">No businesses assigned</span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/20">
                {businesses.map(business => (
                  <div key={business.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`business-${business.id}`}
                      checked={formData.businessIds.includes(business.id)}
                      onCheckedChange={() => handleBusinessToggle(business.id)}
                    />
                    <label
                      htmlFor={`business-${business.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {business.name}
                    </label>
                  </div>
                ))}
                {businesses.length === 0 && (
                  <span className="text-sm text-muted-foreground col-span-2">No businesses available</span>
                )}
              </div>
            )}
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
