export const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'Fr',
  CNY: '¥',
  INR: '₹',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  MXN: 'MX$',
  BRL: 'R$',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
};

export function getCurrencySymbol(currency?: string): string {
  return CURRENCY_SYMBOLS[currency || 'LKR'] || 'Rs';
}

export function formatPrice(price: number | string, currency?: string): string {
  const numPrice = typeof price === 'number' ? price : parseFloat(price);
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${numPrice.toFixed(2)}`;
}
