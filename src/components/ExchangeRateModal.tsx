
import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fromCurrency: '',
    toCurrency: '',
    rate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromCurrency || !formData.toCurrency || !formData.rate) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromCurrency === formData.toCurrency) {
      toast({
        title: "Error",
        description: "From and To currencies must be different.",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid exchange rate.",
        variant: "destructive",
      });
      return;
    }

    // Check if rate already exists
    const existingRate = (data.exchangeRates || []).find(
      r => r.fromCurrency === formData.fromCurrency && r.toCurrency === formData.toCurrency
    );

    if (existingRate) {
      dispatch({
        type: 'UPDATE_EXCHANGE_RATE',
        payload: {
          id: existingRate.id,
          updates: { rate, updatedAt: new Date().toISOString() },
        },
      });
      toast({
        title: "Success",
        description: "Exchange rate updated successfully.",
      });
    } else {
      const exchangeRate = {
        id: generateId(),
        fromCurrency: formData.fromCurrency,
        toCurrency: formData.toCurrency,
        rate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({
        type: 'ADD_EXCHANGE_RATE',
        payload: exchangeRate,
      });

      toast({
        title: "Success",
        description: "Exchange rate added successfully.",
      });
    }

    setFormData({
      fromCurrency: '',
      toCurrency: '',
      rate: '',
    });
  };

  const handleDeleteRate = (rateId: string) => {
    dispatch({
      type: 'DELETE_EXCHANGE_RATE',
      payload: rateId,
    });
    toast({
      title: "Success",
      description: "Exchange rate deleted successfully.",
    });
  };

  const getCurrencyName = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency ? `${currency.symbol} ${currency.name}` : code;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Exchange Rates</DialogTitle>
          <DialogDescription>
            Set up currency conversion rates for salary calculations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add/Update Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Exchange Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromCurrency">From Currency</Label>
                    <Select
                      value={formData.fromCurrency}
                      onValueChange={(value) => setFormData({ ...formData, fromCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="toCurrency">To Currency</Label>
                    <Select
                      value={formData.toCurrency}
                      onValueChange={(value) => setFormData({ ...formData, toCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rate">Exchange Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.0001"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="e.g., 1500 (1 USD = 1500 NGN)"
                  />
                  {formData.fromCurrency && formData.toCurrency && formData.rate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      1 {formData.fromCurrency} = {formData.rate} {formData.toCurrency}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Add/Update Rate
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Exchange Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {(data.exchangeRates || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No exchange rates configured yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(data.exchangeRates || []).map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{rate.fromCurrency}</Badge>
                        <span className="text-sm">→</span>
                        <Badge variant="secondary">{rate.toCurrency}</Badge>
                        <span className="text-sm font-medium">{rate.rate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Updated: {new Date(rate.updatedAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRate(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
