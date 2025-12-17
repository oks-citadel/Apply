'use client';

import React, { useState } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

interface LanguageSwitcherProps {
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

export function LanguageSwitcher({
  currentLanguage = 'en',
  onLanguageChange,
}: LanguageSwitcherProps) {
  const [selected, setSelected] = useState(currentLanguage);

  const handleChange = (languageCode: string) => {
    setSelected(languageCode);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
  };

  return (
    <div data-testid="language-switcher">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
