
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Currency, SUPPORTED_CURRENCIES } from '@/types/business';

interface BusinessSetupProps {
  onComplete: () => void;
}

export const BusinessSetup: React.FC<BusinessSetupProps> = ({ onComplete }) => {
  const { addBusiness } = useBusiness();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    currentBalance: '',
    minimumBalance: '',
    currency: SUPPORTED_CURRENCIES[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) return;
    
    addBusiness({
      name: formData.name,
      type: formData.type,
      currentBalance: parseFloat(formData.currentBalance) || 0,
      minimumBalance: parseFloat(formData.minimumBalance) || 0,
      currency: formData.currency,
    });
    
    onComplete();
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
    setFormData(prev => ({ ...prev, currency }));
  };

  return (
    <Card className="dashboard-surface border-dashboard-border shadow-xl max-w-2xl w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl dashboard-text-primary">Add New Business</CardTitle>
            <CardDescription className="dashboard-text-secondary">
              Set up a new business to manage projects and finances
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onComplete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="dashboard-text-primary">Business Name</Label>
            <Input
              id="businessName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Digital Agency Pro"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType" className="dashboard-text-primary">Business Type</Label>
            <Input
              id="businessType"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              placeholder="e.g., Digital Marketing Agency, Consulting"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency" className="dashboard-text-primary">Default Currency</Label>
            <Select value={formData.currency.code} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentBalance" className="dashboard-text-primary">Current Balance</Label>
              <Input
                id="currentBalance"
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumBalance" className="dashboard-text-primary">Minimum Balance Alert</Label>
              <Input
                id="minimumBalance"
                type="number"
                step="0.01"
                value={formData.minimumBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumBalance: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancel
            </Button>
            <Button type="submit">
              Create Business
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
