/**
 * Translation message structure
 */
export interface TranslationMessages {
  [key: string]: string | TranslationMessages;
}

/**
 * Translation key type (dot notation supported)
 */
export type TranslationKey = string;

/**
 * Interpolation values for messages
 */
export interface InterpolationValues {
  [key: string]: string | number | boolean | Date;
}

/**
 * Format options
 */
export interface FormatOptions {
  locale?: string;
}

/**
 * Number format options
 */
export interface NumberFormatOptions extends FormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Date format options
 */
export interface DateFormatOptions extends FormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  timeZone?: string;
}

/**
 * Currency format options
 */
export interface CurrencyFormatOptions extends FormatOptions {
  currency: string;
  display?: 'symbol' | 'code' | 'name';
}
