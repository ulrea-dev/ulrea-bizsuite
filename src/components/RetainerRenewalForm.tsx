import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RetainerRenewal, RenewalType, Currency, SUPPORTED_CURRENCIES, ExchangeRate } from '@/types/business';
import { generateId } from '@/utils/storage';
import { getExchangeRateDisplay, getCurrencySymbol } from '@/utils/currencyConversion';

interface RetainerRenewalFormProps {
  renewals: RetainerRenewal[];
  onRenewalsChange: (renewals: RetainerRenewal[]) => void;
  retainerCurrency: string;
  exchangeRates: ExchangeRate[];
  customCurrencies: Currency[];
  isReadOnly?: boolean;
}

const RENEWAL_TYPES: { value: RenewalType; label: string }[] = [
  { value: 'domain', label: 'Domain' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'software', label: 'Software' },
  { value: 'ssl', label: 'SSL Certificate' },
  { value: 'email', label: 'Email Services' },
  { value: 'other', label: 'Other' },
];

export const RetainerRenewalForm: React.FC<RetainerRenewalFormProps> = ({
  renewals,
  onRenewalsChange,
  retainerCurrency,
  exchangeRates,
  customCurrencies,
  isReadOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'domain' as RenewalType,
    amount: '',
    currency: 'USD',
    frequency: 'yearly' as 'monthly' | 'quarterly' | 'yearly',
    nextRenewalDate: new Date(),
    description: '',
  });

  const allCurrencies = [...SUPPORTED_CURRENCIES, ...customCurrencies];
  
  const isDifferentCurrency = formData.currency !== retainerCurrency;
  const rateInfo = isDifferentCurrency 
    ? getExchangeRateDisplay(formData.currency, retainerCurrency, exchangeRates)
    : null;
  
  const parsedAmount = parseFloat(formData.amount) || 0;
  const convertedAmount = rateInfo ? parsedAmount * rateInfo.rate : parsedAmount;
  const retainerSymbol = getCurrencySymbol(retainerCurrency);

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.amount) return;
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const newRenewal: RetainerRenewal = {
      id: generateId(),
      name: formData.name.trim(),
      type: formData.type,
      amount,
      currency: formData.currency,
      frequency: formData.frequency,
      nextRenewalDate: formData.nextRenewalDate.toISOString(),
      description: formData.description.trim() || undefined,
    };

    onRenewalsChange([...renewals, newRenewal]);
    
    // Reset form
    setFormData({
      name: '',
      type: 'domain',
      amount: '',
      currency: 'USD',
      frequency: 'yearly',
      nextRenewalDate: new Date(),
      description: '',
    });
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onRenewalsChange(renewals.filter(r => r.id !== id));
  };

  if (isReadOnly) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Renewals (Optional)</Label>
        {!isAdding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Renewal
          </Button>
        )}
      </div>

      {/* Existing renewals list */}
      {renewals.length > 0 && (
        <div className="space-y-2">
          {renewals.map(renewal => {
            const renewalRateInfo = renewal.currency !== retainerCurrency
              ? getExchangeRateDisplay(renewal.currency, retainerCurrency, exchangeRates)
              : null;
            const renewalConverted = renewalRateInfo 
              ? renewal.amount * renewalRateInfo.rate 
              : renewal.amount;
            const renewalSymbol = getCurrencySymbol(renewal.currency);

            return (
              <div key={renewal.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{renewal.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">({renewal.type})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {renewalSymbol}{renewal.amount.toLocaleString()} {renewal.currency} / {renewal.frequency}
                    {renewal.currency !== retainerCurrency && renewalRateInfo && (
                      <span className="ml-2 text-primary">
                        → {retainerSymbol}{renewalConverted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {renewal.currency !== retainerCurrency && !renewalRateInfo && (
                      <span className="ml-2 text-amber-600">⚠️ No rate set</span>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(renewal.id)}>
                  ✕
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add renewal form */}
      {isAdding && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., example.com Domain"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: RenewalType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RENEWAL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <CurrencyInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                allowDecimals={true}
                maxDecimals={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Next Renewal Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.nextRenewalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.nextRenewalDate ? format(formData.nextRenewalDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.nextRenewalDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, nextRenewalDate: date });
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Exchange rate display */}
          {isDifferentCurrency && parsedAmount > 0 && (
            <div className="p-3 rounded-lg bg-background border">
              {rateInfo ? (
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Rate: {rateInfo.display}</span>
                  <span className="font-medium text-primary">
                    Converted: {retainerSymbol}{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {retainerCurrency}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>No exchange rate set for {formData.currency} → {retainerCurrency}. Please set one in Settings.</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAdd} disabled={!formData.name.trim() || !formData.amount}>
              Add Renewal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
