import { SUPPORTED_CURRENCIES, Currency } from '@/types/business';

export interface CurrencyTotals {
  [currencyCode: string]: number;
}

/**
 * Groups amounts by currency code
 */
export function groupByCurrency<T>(
  items: T[],
  getAmount: (item: T) => number,
  getCurrency: (item: T) => string
): CurrencyTotals {
  return items.reduce((acc, item) => {
    const currency = getCurrency(item);
    const amount = getAmount(item);
    acc[currency] = (acc[currency] || 0) + amount;
    return acc;
  }, {} as CurrencyTotals);
}

/**
 * Gets the symbol for a currency code
 */
export function getCurrencySymbol(
  code: string,
  customCurrencies: Currency[] = []
): string {
  const allCurrencies = [...SUPPORTED_CURRENCIES, ...customCurrencies];
  return allCurrencies.find((c) => c.code === code)?.symbol || code;
}

/**
 * Formats an amount with currency symbol
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  customCurrencies: Currency[] = []
): string {
  const symbol = getCurrencySymbol(currencyCode, customCurrencies);
  return `${symbol}${amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
