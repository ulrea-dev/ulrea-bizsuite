
import { Currency, ExchangeRate, SUPPORTED_CURRENCIES } from '@/types/business';

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: ExchangeRate[]
): number => {
  if (fromCurrency.code === toCurrency.code) {
    return amount;
  }

  // Find the exchange rate
  const rate = exchangeRates.find(
    rate => rate.fromCurrency === fromCurrency.code && rate.toCurrency === toCurrency.code
  );

  if (!rate) {
    console.warn(`No exchange rate found for ${fromCurrency.code} to ${toCurrency.code}`);
    return amount; // Return original amount if no rate found
  }

  return amount * rate.rate;
};

export const getExchangeRate = (
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): number | null => {
  const rate = exchangeRates.find(
    rate => rate.fromCurrency === fromCurrency && rate.toCurrency === toCurrency
  );
  return rate ? rate.rate : null;
};

export const getExchangeRateDisplay = (
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): { rate: number; display: string } | null => {
  const rate = getExchangeRate(fromCurrency, toCurrency, exchangeRates);
  if (rate === null) return null;
  
  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);
  
  return {
    rate,
    display: `1 ${fromCurrency} = ${toSymbol}${rate.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  };
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export const convertAmountWithRate = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): { converted: number; rate: number | null } => {
  if (fromCurrency === toCurrency) {
    return { converted: amount, rate: 1 };
  }
  
  const rate = getExchangeRate(fromCurrency, toCurrency, exchangeRates);
  if (rate === null) {
    return { converted: amount, rate: null };
  }
  
  return { converted: amount * rate, rate };
};

export const formatCurrencyWithConversion = (
  amount: number,
  currency: Currency,
  targetCurrency: Currency,
  exchangeRates: ExchangeRate[]
): string => {
  const convertedAmount = convertCurrency(amount, currency, targetCurrency, exchangeRates);
  
  let formattedAmount: string;
  
  if (Math.abs(convertedAmount) >= 1000000) {
    formattedAmount = (convertedAmount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (Math.abs(convertedAmount) >= 1000) {
    formattedAmount = (convertedAmount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    formattedAmount = convertedAmount.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
  
  return `${targetCurrency.symbol}${formattedAmount}`;
};
