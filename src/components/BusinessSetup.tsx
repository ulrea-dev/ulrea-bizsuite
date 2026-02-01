import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Briefcase, Package, Layers } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Currency, BusinessModel, SUPPORTED_CURRENCIES } from '@/types/business';
import { cn } from '@/lib/utils';

interface BusinessSetupProps {
  onComplete: () => void;
}

const BUSINESS_MODEL_OPTIONS: { value: BusinessModel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'service',
    label: 'Service-Based',
    description: 'For agencies, consulting, freelancing. Manage projects, clients, and retainers.',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    value: 'product',
    label: 'Product-Based',
    description: 'For retail, manufacturing, distribution. Manage products, inventory, and customers.',
    icon: <Package className="h-5 w-5" />,
  },
  {
    value: 'hybrid',
    label: 'Hybrid (Both)',
    description: 'For businesses that offer both services and products. Full access to all features.',
    icon: <Layers className="h-5 w-5" />,
  },
];

export const BusinessSetup: React.FC<BusinessSetupProps> = ({ onComplete }) => {
  const { addBusiness } = useBusiness();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    businessModel: 'service' as BusinessModel,
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
      businessModel: formData.businessModel,
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
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Business Model Selection */}
          <div className="space-y-3">
            <Label className="dashboard-text-primary">Business Model</Label>
            <div className="grid gap-3">
              {BUSINESS_MODEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, businessModel: option.value }))}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    formData.businessModel === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-background"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-md",
                    formData.businessModel === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      formData.businessModel === option.value
                        ? "text-foreground"
                        : "text-foreground/80"
                    )}>
                      {option.label}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType" className="dashboard-text-primary">Business Category</Label>
            <Input
              id="businessType"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              placeholder={
                formData.businessModel === 'service' 
                  ? "e.g., Digital Marketing Agency, Consulting" 
                  : formData.businessModel === 'product'
                  ? "e.g., Furniture Manufacturing, Clothing Retail"
                  : "e.g., Tech Solutions, Creative Studio"
              }
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
              <CurrencyInput
                id="currentBalance"
                value={formData.currentBalance}
                onChange={(value) => setFormData(prev => ({ ...prev, currentBalance: value }))}
                placeholder="0.00"
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumBalance" className="dashboard-text-primary">Minimum Balance Alert</Label>
              <CurrencyInput
                id="minimumBalance"
                value={formData.minimumBalance}
                onChange={(value) => setFormData(prev => ({ ...prev, minimumBalance: value }))}
                placeholder="0.00"
                allowDecimals={true}
                maxDecimals={2}
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
