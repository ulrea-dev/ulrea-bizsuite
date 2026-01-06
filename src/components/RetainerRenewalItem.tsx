import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Globe, Server, Code, Lock, Mail, Package, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { RetainerRenewal, RenewalType, ExchangeRate } from '@/types/business';
import { getExchangeRateDisplay, getCurrencySymbol } from '@/utils/currencyConversion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RetainerRenewalItemProps {
  renewal: RetainerRenewal;
  retainerCurrency: string;
  exchangeRates: ExchangeRate[];
  onRemove?: () => void;
  isReadOnly?: boolean;
  compact?: boolean;
}

const renewalTypeConfig: Record<RenewalType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  domain: { label: 'Domain', icon: Globe, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  hosting: { label: 'Hosting', icon: Server, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  software: { label: 'Software', icon: Code, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  ssl: { label: 'SSL', icon: Lock, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  email: { label: 'Email', icon: Mail, color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  other: { label: 'Other', icon: Package, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
};

export const RetainerRenewalItem: React.FC<RetainerRenewalItemProps> = ({
  renewal,
  retainerCurrency,
  exchangeRates,
  onRemove,
  isReadOnly = false,
  compact = false,
}) => {
  const config = renewalTypeConfig[renewal.type] || renewalTypeConfig.other;
  const Icon = config.icon;
  
  const isDifferentCurrency = renewal.currency !== retainerCurrency;
  const rateInfo = isDifferentCurrency 
    ? getExchangeRateDisplay(renewal.currency, retainerCurrency, exchangeRates)
    : null;
  
  const convertedAmount = rateInfo 
    ? renewal.amount * rateInfo.rate 
    : renewal.amount;
  
  const renewalSymbol = getCurrencySymbol(renewal.currency);
  const retainerSymbol = getCurrencySymbol(retainerCurrency);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{renewal.name}</span>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.label}
          </Badge>
        </div>
        <div className="text-right">
          <div className="font-medium text-sm">
            {renewalSymbol}{renewal.amount.toLocaleString()}
            {isDifferentCurrency && rateInfo && (
              <span className="text-muted-foreground ml-1">
                → {retainerSymbol}{convertedAmount.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground capitalize">{renewal.frequency}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{renewal.name}</span>
          <Badge variant="outline" className={cn(config.color)}>
            {config.label}
          </Badge>
        </div>
        {!isReadOnly && onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Amount</p>
          <p className="font-medium">{renewalSymbol}{renewal.amount.toLocaleString()} {renewal.currency}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Frequency</p>
          <p className="font-medium capitalize">{renewal.frequency}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Next Renewal</p>
          <p className="font-medium">{format(new Date(renewal.nextRenewalDate), 'PP')}</p>
        </div>
        {renewal.description && (
          <div>
            <p className="text-muted-foreground">Description</p>
            <p className="font-medium">{renewal.description}</p>
          </div>
        )}
      </div>
      
      {isDifferentCurrency && (
        <div className="border-t pt-3">
          {rateInfo ? (
            <div className="flex items-center gap-2 text-sm">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Rate: {rateInfo.display}</span>
              <span className="font-medium text-primary">
                → {retainerSymbol}{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {retainerCurrency}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>No exchange rate set for {renewal.currency} → {retainerCurrency}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
