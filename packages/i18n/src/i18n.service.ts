import { SupportedLocale, DEFAULT_LOCALE, isValidLocale } from './locales';
import { formatMessage } from './formatters';
import type { TranslationMessages, TranslationKey, InterpolationValues } from './types';

export interface I18nConfig {
  defaultLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  messages?: Record<string, TranslationMessages>;
}

/**
 * Internationalization service for managing translations
 */
export class I18nService {
  private readonly defaultLocale: SupportedLocale;
  private readonly fallbackLocale: SupportedLocale;
  private readonly messages: Map<string, TranslationMessages>;
  private currentLocale: SupportedLocale;

  constructor(config: I18nConfig = {}) {
    this.defaultLocale = config.defaultLocale || DEFAULT_LOCALE;
    this.fallbackLocale = config.fallbackLocale || DEFAULT_LOCALE;
    this.messages = new Map();
    this.currentLocale = this.defaultLocale;

    // Load initial messages
    if (config.messages) {
      for (const [locale, translations] of Object.entries(config.messages)) {
        this.messages.set(locale, translations);
      }
    }
  }

  /**
   * Set the current locale
   */
  setLocale(locale: string): void {
    if (isValidLocale(locale)) {
      this.currentLocale = locale;
    } else {
      console.warn(`Invalid locale "${locale}", using fallback "${this.fallbackLocale}"`);
      this.currentLocale = this.fallbackLocale;
    }
  }

  /**
   * Get the current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Add translations for a locale
   */
  addMessages(locale: string, messages: TranslationMessages): void {
    const existing = this.messages.get(locale) || {};
    this.messages.set(locale, this.mergeDeep(existing, messages));
  }

  /**
   * Translate a key with optional interpolation
   */
  t(key: TranslationKey, values?: InterpolationValues): string {
    // Try current locale first
    let message = this.getMessage(this.currentLocale, key);

    // Fall back to fallback locale
    if (!message && this.currentLocale !== this.fallbackLocale) {
      message = this.getMessage(this.fallbackLocale, key);
    }

    // Return key if no translation found
    if (!message) {
      console.warn(`Missing translation for key "${key}" in locale "${this.currentLocale}"`);
      return key;
    }

    return formatMessage(message, values, this.currentLocale);
  }

  /**
   * Check if a translation exists
   */
  hasTranslation(key: TranslationKey, locale?: string): boolean {
    const targetLocale = locale || this.currentLocale;
    return this.getMessage(targetLocale, key) !== undefined;
  }

  /**
   * Get a message from the translations
   */
  private getMessage(locale: string, key: string): string | undefined {
    const translations = this.messages.get(locale);
    if (!translations) {
      return undefined;
    }

    // Support dot notation for nested keys
    const keys = key.split('.');
    let current: TranslationMessages | string = translations;

    for (const k of keys) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = current[k] as any;
    }

    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Deep merge two objects
   */
  private mergeDeep(target: TranslationMessages, source: TranslationMessages): TranslationMessages {
    const output = { ...target };

    for (const key of Object.keys(source)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        typeof output[key] === 'object' &&
        output[key] !== null
      ) {
        output[key] = this.mergeDeep(
          output[key] as TranslationMessages,
          source[key] as TranslationMessages
        );
      } else {
        output[key] = source[key] as any;
      }
    }

    return output;
  }
}
