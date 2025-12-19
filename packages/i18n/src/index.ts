// ApplyForUs Internationalization (i18n) Utilities
// Multi-language support for the ApplyForUs platform

export { I18nService, type I18nConfig } from './i18n.service';
export { formatMessage, formatNumber, formatDate, formatCurrency } from './formatters';
export { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES, isValidLocale } from './locales';
export type { TranslationKey, TranslationMessages } from './types';
