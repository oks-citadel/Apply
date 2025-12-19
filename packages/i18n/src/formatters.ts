import { IntlMessageFormat } from 'intl-messageformat';
import { DEFAULT_LOCALE } from './locales';
import type {
  InterpolationValues,
  NumberFormatOptions,
  DateFormatOptions,
  CurrencyFormatOptions,
} from './types';

/**
 * Format a message with interpolation
 */
export function formatMessage(
  message: string,
  values?: InterpolationValues,
  locale: string = DEFAULT_LOCALE
): string {
  if (!values || Object.keys(values).length === 0) {
    return message;
  }

  try {
    const formatter = new IntlMessageFormat(message, locale);
    return formatter.format(values) as string;
  } catch {
    // Return original message if formatting fails
    return message;
  }
}

/**
 * Format a number
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const { locale = DEFAULT_LOCALE, ...formatOptions } = options;

  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Format a date
 */
export function formatDate(
  value: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const { locale = DEFAULT_LOCALE, ...formatOptions } = options;
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format a currency value
 */
export function formatCurrency(
  value: number,
  options: CurrencyFormatOptions
): string {
  const { locale = DEFAULT_LOCALE, currency, display = 'symbol' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: display,
  }).format(value);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

/**
 * Format a list of items
 */
export function formatList(
  items: string[],
  options: { type?: 'conjunction' | 'disjunction'; locale?: string } = {}
): string {
  const { type = 'conjunction', locale = DEFAULT_LOCALE } = options;

  return new Intl.ListFormat(locale, { style: 'long', type }).format(items);
}
