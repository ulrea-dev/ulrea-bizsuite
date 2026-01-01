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
  variant?: 'list' | 'compact';
  filterCurrency?: string; // Filter to show only this currency
}

export const CurrencyTotals: React.FC<CurrencyTotalsProps> = ({
  totals,
  customCurrencies = [],
  className,
  amountClassName,
  showCurrencyCode = true,
  variant = 'list',
  filterCurrency,
}) => {
  let currencies = Object.keys(totals);
  
  // Apply currency filter if specified
  if (filterCurrency && filterCurrency !== 'all') {
    currencies = currencies.filter(c => c === filterCurrency);
  }
  
  if (currencies.length === 0) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  // Compact variant: horizontal inline display
  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
        {currencies.map((currency, index) => (
          <span key={currency} className="inline-flex items-baseline gap-1">
            <span className={cn("font-bold", amountClassName)}>
              {formatCurrencyAmount(totals[currency], currency, customCurrencies)}
            </span>
            {showCurrencyCode && (
              <span className="text-xs text-muted-foreground">{currency}</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  // List variant: vertical stacked display (default)
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
