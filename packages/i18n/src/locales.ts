/**
 * Supported locales for ApplyForUs
 */
export enum SupportedLocale {
  EnglishUS = 'en-US',
  EnglishUK = 'en-GB',
  Spanish = 'es',
  French = 'fr',
  German = 'de',
  Portuguese = 'pt',
  PortugueseBrazil = 'pt-BR',
  Chinese = 'zh',
  Japanese = 'ja',
  Korean = 'ko',
  Arabic = 'ar',
  Hindi = 'hi',
  Swahili = 'sw',
  Yoruba = 'yo',
  Zulu = 'zu',
}

/**
 * Default locale
 */
export const DEFAULT_LOCALE = SupportedLocale.EnglishUS;

/**
 * List of supported locales
 */
export const SUPPORTED_LOCALES = Object.values(SupportedLocale);

/**
 * Check if a locale is supported
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: SupportedLocale): string {
  const displayNames: Record<SupportedLocale, string> = {
    [SupportedLocale.EnglishUS]: 'English (US)',
    [SupportedLocale.EnglishUK]: 'English (UK)',
    [SupportedLocale.Spanish]: 'Espanol',
    [SupportedLocale.French]: 'Francais',
    [SupportedLocale.German]: 'Deutsch',
    [SupportedLocale.Portuguese]: 'Portugues',
    [SupportedLocale.PortugueseBrazil]: 'Portugues (Brasil)',
    [SupportedLocale.Chinese]: '中文',
    [SupportedLocale.Japanese]: '日本語',
    [SupportedLocale.Korean]: '한국어',
    [SupportedLocale.Arabic]: 'العربية',
    [SupportedLocale.Hindi]: 'हिन्दी',
    [SupportedLocale.Swahili]: 'Kiswahili',
    [SupportedLocale.Yoruba]: 'Yoruba',
    [SupportedLocale.Zulu]: 'isiZulu',
  };

  return displayNames[locale];
}

/**
 * Get language direction (LTR or RTL)
 */
export function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  const rtlLocales = [SupportedLocale.Arabic];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}
