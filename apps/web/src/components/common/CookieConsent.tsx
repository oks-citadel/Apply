'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Cookie, Shield, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Cookie categories for GDPR compliance
 */
export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

/**
 * Cookie Consent Banner Component
 *
 * GDPR/CCPA compliant cookie consent banner with granular controls.
 * Stores preferences in localStorage and emits consent events.
 *
 * Features:
 * - Granular cookie category controls
 * - "Accept All" and "Reject All" options
 * - Preference customization
 * - Persistent consent storage
 * - Consent event emission for analytics
 */
export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  // Check for existing consent on mount
  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  // Save consent and preferences
  const saveConsent = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString());
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));

    // Emit consent event for analytics
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cookie-consent', {
          detail: { preferences: prefs, timestamp: new Date().toISOString() },
        })
      );

      // Update analytics consent if gtag exists
      if ((window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          analytics_storage: prefs.analytics ? 'granted' : 'denied',
          ad_storage: prefs.marketing ? 'granted' : 'denied',
          functionality_storage: prefs.functional ? 'granted' : 'denied',
        });
      }
    }

    setPreferences(prefs);
    setIsVisible(false);
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  }, [saveConsent]);

  // Reject non-essential cookies
  const rejectAll = useCallback(() => {
    saveConsent(DEFAULT_PREFERENCES);
  }, [saveConsent]);

  // Save custom preferences
  const saveCustom = useCallback(() => {
    saveConsent(preferences);
  }, [preferences, saveConsent]);

  // Toggle category preference
  const toggleCategory = useCallback(
    (category: keyof CookiePreferences) => {
      if (category === 'essential') return; // Cannot disable essential
      setPreferences((prev) => ({
        ...prev,
        [category]: !prev[category],
      }));
    },
    []
  );

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Cookie className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cookie Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We use cookies to enhance your experience and analyze our traffic.
              </p>
            </div>
          </div>
          <button
            onClick={rejectAll}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cookie Categories (Collapsible) */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showDetails ? 'Hide details' : 'Customize preferences'}
        </button>

        {showDetails && (
          <div className="grid gap-4 mb-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Essential Cookies */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">Essential</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                  Required
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Required for the website to function. Cannot be disabled.
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">Functional</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={() => toggleCategory('functional')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enable personalized features and preferences.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">Analytics</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => toggleCategory('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Help us understand how you use our website.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">Marketing</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => toggleCategory('marketing')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enable personalized ads and offers.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-end">
          <a
            href="/privacy"
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Privacy Policy
          </a>
          <button
            onClick={rejectAll}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Reject All
          </button>
          {showDetails && (
            <button
              onClick={saveCustom}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-600 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
            >
              Save Preferences
            </button>
          )}
          <button
            onClick={acceptAll}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Accept All
          </button>
        </div>

        {/* Privacy Links */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
          By using our site, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
