
import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Currency } from '@/types/business';

interface CustomCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCurrencyAdded: (currency: Currency) => void;
}

export const CustomCurrencyModal: React.FC<CustomCurrencyModalProps> = ({
  isOpen,
  onClose,
  onCurrencyAdded,
}) => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: '',
    symbol: '',
    name: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.symbol || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if currency code already exists
    const allCurrencies = [...(data.customCurrencies || [])];
    const existingCurrency = allCurrencies.find(c => c.code.toLowerCase() === formData.code.toLowerCase());

    if (existingCurrency) {
      toast({
        title: "Error",
        description: "A currency with this code already exists.",
        variant: "destructive",
      });
      return;
    }

    const newCurrency: Currency = {
      code: formData.code.toUpperCase(),
      symbol: formData.symbol,
      name: formData.name,
      isCustom: true,
    };

    dispatch({
      type: 'ADD_CUSTOM_CURRENCY',
      payload: newCurrency,
    });

    onCurrencyAdded(newCurrency);

    toast({
      title: "Success",
      description: "Custom currency added successfully.",
    });

    setFormData({
      code: '',
      symbol: '',
      name: '',
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Custom Currency</DialogTitle>
          <DialogDescription>
            Create a custom currency for your business needs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Currency Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., BTC, USDT"
              maxLength={10}
            />
          </div>

          <div>
            <Label htmlFor="symbol">Currency Symbol</Label>
            <Input
              id="symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="e.g., ₿, ₮"
              maxLength={5}
            />
          </div>

          <div>
            <Label htmlFor="name">Currency Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Bitcoin, Tether"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Currency</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
