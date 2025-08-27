
import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { generateId } from '@/utils/storage';
import { SUPPORTED_CURRENCIES } from '@/types/business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const CurrencyRateSettings: React.FC = () => {
  const { data, dispatch } = useBusiness();
  const { toast } = useToast();
  const [newRate, setNewRate] = useState({
    fromCurrency: '',
    toCurrency: '',
    rate: '',
  });

  const allCurrencies = [
    ...SUPPORTED_CURRENCIES,
    ...(data.customCurrencies || [])
  ];

  const handleAddRate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRate.fromCurrency || !newRate.toCurrency || !newRate.rate) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const rate = parseFloat(newRate.rate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid exchange rate.",
        variant: "destructive",
      });
      return;
    }

    if (newRate.fromCurrency === newRate.toCurrency) {
      toast({
        title: "Error",
        description: "From and To currencies cannot be the same.",
        variant: "destructive",
      });
      return;
    }

    // Check if rate already exists
    const existingRate = data.exchangeRates?.find(
      r => r.fromCurrency === newRate.fromCurrency && r.toCurrency === newRate.toCurrency
    );

    if (existingRate) {
      // Update existing rate
      dispatch({
        type: 'UPDATE_EXCHANGE_RATE',
        payload: {
          id: existingRate.id,
          updates: {
            rate,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      toast({
        title: "Success",
        description: "Exchange rate updated successfully.",
      });
    } else {
      // Add new rate
      const exchangeRate = {
        id: generateId(),
        fromCurrency: newRate.fromCurrency,
        toCurrency: newRate.toCurrency,
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

    setNewRate({ fromCurrency: '', toCurrency: '', rate: '' });
  };

  const handleDeleteRate = (id: string) => {
    dispatch({
      type: 'DELETE_EXCHANGE_RATE',
      payload: id,
    });
    toast({
      title: "Success",
      description: "Exchange rate deleted successfully.",
    });
  };

  const getCurrencyName = (code: string) => {
    const currency = allCurrencies.find(c => c.code === code);
    return currency ? `${currency.symbol} ${currency.name}` : code;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Currency Exchange Rates</CardTitle>
          <CardDescription>
            Set custom exchange rates for salary calculations. These rates will be used when converting salaries from different currencies to your default currency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddRate} className="grid grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="fromCurrency">From Currency</Label>
              <Select
                value={newRate.fromCurrency}
                onValueChange={(value) => setNewRate({ ...newRate, fromCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map((currency) => (
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
                value={newRate.toCurrency}
                onValueChange={(value) => setNewRate({ ...newRate, toCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rate">Exchange Rate</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                min="0"
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                placeholder="1.2345"
              />
            </div>

            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="font-medium">Current Exchange Rates</h4>
            {!data.exchangeRates || data.exchangeRates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exchange rates set. Add rates above to enable currency conversion for salaries.</p>
            ) : (
              <div className="space-y-2">
                {data.exchangeRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">
                        {getCurrencyName(rate.fromCurrency)} → {getCurrencyName(rate.toCurrency)}
                      </span>
                      <span className="ml-4 text-muted-foreground">
                        Rate: {rate.rate}
                      </span>
                      <span className="ml-4 text-xs text-muted-foreground">
                        Updated: {new Date(rate.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Exchange Rate</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this exchange rate? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRate(rate.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
