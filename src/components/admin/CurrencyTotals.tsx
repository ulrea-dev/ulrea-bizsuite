import React from 'react';
import { CurrencyTotals as CurrencyTotalsType, formatCurrencyAmount } from '@/utils/currencySummary';
import { Currency } from '@/types/business';
import { cn } from '@/lib/utils';

interface CurrencyTotalsProps {
  totals: CurrencyTotalsType;
  customCurrencies?: Currency[];
  className?: string;
  amountClassName?: string;
  showCurrencyCode?: boolean;
}

export const CurrencyTotals: React.FC<CurrencyTotalsProps> = ({
  totals,
  customCurrencies = [],
  className,
  amountClassName,
  showCurrencyCode = true,
}) => {
  const currencies = Object.keys(totals);
  
  if (currencies.length === 0) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  return (
    <div className={cn("space-y-1", className)}>
      {currencies.map((currency) => (
        <div key={currency} className="flex items-baseline gap-1.5">
          <span className={cn("font-bold", amountClassName)}>
            {formatCurrencyAmount(totals[currency], currency, customCurrencies)}
          </span>
          {showCurrencyCode && (
            <span className="text-xs text-muted-foreground">{currency}</span>
          )}
        </div>
      ))}
    </div>
  );
};
