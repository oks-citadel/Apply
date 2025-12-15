'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Cookie, Settings, Shield } from 'lucide-react';

export default function CookiePolicyPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Cookie Policy</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version 1.0 | Last Updated: December 14, 2024
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors print:hidden"
          >
            <Download className="w-4 h-4" />
            <span>Print/Save PDF</span>
          </button>
        </div>

        {/* Plain Language Summary */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 p-6 rounded-r-lg">
          <div className="flex items-start space-x-3">
            <Cookie className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What Are Cookies?
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Cookies are small text files stored on your device when you visit our website. They help us provide
                a better experience by remembering your preferences and understanding how you use our services.
              </p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Quick Summary:</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>• We use cookies to keep you logged in and remember your preferences</li>
                <li>• Some cookies help us understand how people use our platform</li>
                <li>• You can control cookie settings in your browser</li>
                <li>• Essential cookies are necessary for the platform to work</li>
                <li>• We respect your privacy choices under GDPR, CCPA, and other laws</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cookie Consent Management */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-6 rounded-r-lg print:hidden">
          <div className="flex items-start space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Manage Your Cookie Preferences
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                You can customize which cookies we use. Essential cookies cannot be disabled as they're required
                for the platform to function.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Open Cookie Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          {[
            { id: 'what-are-cookies', title: '1. What Are Cookies?' },
            { id: 'how-we-use', title: '2. How We Use Cookies' },
            { id: 'types-of-cookies', title: '3. Types of Cookies We Use' },
            { id: 'cookie-details', title: '4. Detailed Cookie Information' },
            { id: 'third-party', title: '5. Third-Party Cookies' },
            { id: 'managing-cookies', title: '6. Managing Cookies' },
            { id: 'your-choices', title: '7. Your Cookie Choices' },
            { id: 'contact', title: '8. Contact Us' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>

      {/* Policy Content */}
      <div className="space-y-6">
        <Section
          id="what-are-cookies"
          title="1. What Are Cookies?"
          expanded={expandedSections.has('what-are-cookies')}
          onToggle={() => toggleSection('what-are-cookies')}
        >
          <p className="mb-4">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website.
            They are widely used to make websites work more efficiently and provide information to website owners.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Types of Cookie Technologies</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cookies</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Small text files stored by your browser. Can be "session" cookies (deleted when you close your
                browser) or "persistent" cookies (remain until deleted or expired).
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Web Beacons (Pixels)</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Tiny graphics with unique identifiers that track which pages you visit and when you open emails.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Local Storage</h4>
              <p className="text-gray-700 dark:text-gray-300">
                HTML5 storage that allows websites to store data locally in your browser.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Session Storage</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Temporary storage that is cleared when you close your browser tab.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="how-we-use"
          title="2. How We Use Cookies"
          expanded={expandedSections.has('how-we-use')}
          onToggle={() => toggleSection('how-we-use')}
        >
          <p className="mb-4">We use cookies and similar technologies for the following purposes:</p>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Essential Operations</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Keeping you logged in to your account</li>
                <li>Remembering your security and authentication settings</li>
                <li>Enabling core platform functionality</li>
                <li>Ensuring security and preventing fraud</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance and Analytics</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Understanding how visitors use our website</li>
                <li>Measuring effectiveness of our services</li>
                <li>Identifying technical issues and improving performance</li>
                <li>Conducting research and analytics</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personalization</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Remembering your preferences and settings</li>
                <li>Providing personalized content and recommendations</li>
                <li>Customizing your user experience</li>
                <li>Saving your language and region preferences</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Marketing and Advertising</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Showing you relevant advertisements</li>
                <li>Measuring ad campaign effectiveness</li>
                <li>Preventing you from seeing the same ads repeatedly</li>
                <li>Understanding your interests (with your consent)</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section
          id="types-of-cookies"
          title="3. Types of Cookies We Use"
          expanded={expandedSections.has('types-of-cookies')}
          onToggle={() => toggleSection('types-of-cookies')}
        >
          <div className="space-y-6">
            <CookieTypeCard
              title="Strictly Necessary Cookies"
              icon={<Shield className="w-6 h-6" />}
              required={true}
              description="These cookies are essential for the platform to function and cannot be disabled."
              examples={[
                'Session authentication tokens',
                'Security tokens and CSRF protection',
                'Load balancing cookies',
                'User preference cookies for accessibility',
              ]}
            />

            <CookieTypeCard
              title="Performance Cookies"
              icon={<Settings className="w-6 h-6" />}
              required={false}
              description="These cookies help us understand how visitors interact with our platform."
              examples={[
                'Google Analytics for usage statistics',
                'Error tracking and debugging',
                'Performance monitoring',
                'A/B testing and feature rollout',
              ]}
            />

            <CookieTypeCard
              title="Functional Cookies"
              icon={<Settings className="w-6 h-6" />}
              required={false}
              description="These cookies enable enhanced functionality and personalization."
              examples={[
                'Remembering your dashboard layout preferences',
                'Storing your theme selection (light/dark mode)',
                'Language and region preferences',
                'Resume and application auto-save',
              ]}
            />

            <CookieTypeCard
              title="Targeting/Advertising Cookies"
              icon={<Settings className="w-6 h-6" />}
              required={false}
              description="These cookies may be set through our site by advertising partners."
              examples={[
                'Google Ads for conversion tracking',
                'LinkedIn Insight Tag',
                'Facebook Pixel',
                'Retargeting and remarketing pixels',
              ]}
            />
          </div>
        </Section>

        <Section
          id="cookie-details"
          title="4. Detailed Cookie Information"
          expanded={expandedSections.has('cookie-details')}
          onToggle={() => toggleSection('cookie-details')}
        >
          <p className="mb-4">
            Below is a detailed list of cookies we use on ApplyForUs:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Cookie Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">session_token</td>
                  <td className="px-4 py-3">Authentication</td>
                  <td className="px-4 py-3">Essential</td>
                  <td className="px-4 py-3">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">csrf_token</td>
                  <td className="px-4 py-3">Security (CSRF protection)</td>
                  <td className="px-4 py-3">Essential</td>
                  <td className="px-4 py-3">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">cookie_consent</td>
                  <td className="px-4 py-3">Stores cookie preferences</td>
                  <td className="px-4 py-3">Essential</td>
                  <td className="px-4 py-3">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">theme_preference</td>
                  <td className="px-4 py-3">Remembers dark/light mode</td>
                  <td className="px-4 py-3">Functional</td>
                  <td className="px-4 py-3">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">language</td>
                  <td className="px-4 py-3">Stores language preference</td>
                  <td className="px-4 py-3">Functional</td>
                  <td className="px-4 py-3">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">_ga</td>
                  <td className="px-4 py-3">Google Analytics - visitor ID</td>
                  <td className="px-4 py-3">Analytics</td>
                  <td className="px-4 py-3">2 years</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">_gid</td>
                  <td className="px-4 py-3">Google Analytics - session ID</td>
                  <td className="px-4 py-3">Analytics</td>
                  <td className="px-4 py-3">24 hours</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">_gat</td>
                  <td className="px-4 py-3">Google Analytics - throttling</td>
                  <td className="px-4 py-3">Analytics</td>
                  <td className="px-4 py-3">1 minute</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">__stripe_sid</td>
                  <td className="px-4 py-3">Stripe payment processing</td>
                  <td className="px-4 py-3">Essential</td>
                  <td className="px-4 py-3">30 minutes</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs">__stripe_mid</td>
                  <td className="px-4 py-3">Stripe fraud detection</td>
                  <td className="px-4 py-3">Essential</td>
                  <td className="px-4 py-3">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="third-party"
          title="5. Third-Party Cookies"
          expanded={expandedSections.has('third-party')}
          onToggle={() => toggleSection('third-party')}
        >
          <p className="mb-4">
            We work with third-party service providers who may also set cookies on your device. These providers
            have their own privacy policies and cookie policies.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics Providers</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Google Analytics:</strong>{' '}
                  <a href="https://policies.google.com/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                  {' | '}
                  <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Opt-out
                  </a>
                </li>
                <li>
                  <strong>Mixpanel:</strong>{' '}
                  <a href="https://mixpanel.com/legal/privacy-policy/" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Advertising Partners</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Google Ads:</strong>{' '}
                  <a href="https://policies.google.com/technologies/ads" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Ad Settings
                  </a>
                </li>
                <li>
                  <strong>Facebook Pixel:</strong>{' '}
                  <a href="https://www.facebook.com/policy/cookies/" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <strong>LinkedIn Insight Tag:</strong>{' '}
                  <a href="https://www.linkedin.com/legal/cookie-policy" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Processors</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Stripe:</strong>{' '}
                  <a href="https://stripe.com/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>PayPal:</strong>{' '}
                  <a href="https://www.paypal.com/us/legalhub/privacy-full" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Authentication Providers</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Google OAuth:</strong>{' '}
                  <a href="https://policies.google.com/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Microsoft OAuth:</strong>{' '}
                  <a href="https://privacy.microsoft.com/en-us/privacystatement" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Statement
                  </a>
                </li>
                <li>
                  <strong>LinkedIn OAuth:</strong>{' '}
                  <a href="https://www.linkedin.com/legal/privacy-policy" className="text-primary-600 dark:text-primary-400 hover:underline">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Section>

        <Section
          id="managing-cookies"
          title="6. Managing Cookies"
          expanded={expandedSections.has('managing-cookies')}
          onToggle={() => toggleSection('managing-cookies')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browser Controls</h3>
          <p className="mb-4">
            Most browsers allow you to control cookies through their settings. You can typically:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>View and delete cookies</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies</li>
            <li>Delete cookies when closing your browser</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browser-Specific Instructions</h3>
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Google Chrome</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Settings → Privacy and security → Cookies and other site data
              </p>
              <a href="https://support.google.com/chrome/answer/95647" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Learn more
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mozilla Firefox</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Settings → Privacy & Security → Cookies and Site Data
              </p>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Learn more
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Safari</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Preferences → Privacy → Manage Website Data
              </p>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Learn more
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Microsoft Edge</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Settings → Cookies and site permissions → Cookies and site data
              </p>
              <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Learn more
              </a>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Note:</strong> Blocking or deleting cookies may impact your ability to use certain features
              of ApplyForUs. Some features may not function properly without cookies enabled.
            </p>
          </div>
        </Section>

        <Section
          id="your-choices"
          title="7. Your Cookie Choices and Rights"
          expanded={expandedSections.has('your-choices')}
          onToggle={() => toggleSection('your-choices')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Cookie Preference Center</h3>
          <p className="mb-4">
            You can manage your cookie preferences at any time through our Cookie Preference Center:
          </p>
          <button className="mb-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium print:hidden">
            Manage Cookie Preferences
          </button>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Regional Rights</h3>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">EU/UK Users (GDPR)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Right to consent or refuse non-essential cookies</li>
                <li>Right to withdraw consent at any time</li>
                <li>Right to access information about cookies we use</li>
                <li>Right to object to processing based on cookies</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">California Users (CCPA/CPRA)</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to limit use of sensitive personal information</li>
                <li>Right to know what data is collected via cookies</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Other Jurisdictions</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Users in other jurisdictions have rights under applicable local laws. Contact us to exercise your rights.
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6">Do Not Track Signals</h3>
          <p className="mb-4">
            Some browsers support "Do Not Track" (DNT) signals. Currently, there is no industry standard for
            responding to DNT signals. We do not currently respond to DNT signals, but we respect your cookie
            choices made through our Cookie Preference Center.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Opt-Out Links</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <a href="https://optout.networkadvertising.org/" className="text-primary-600 dark:text-primary-400 hover:underline">
                Network Advertising Initiative Opt-Out
              </a>
            </li>
            <li>
              <a href="https://optout.aboutads.info/" className="text-primary-600 dark:text-primary-400 hover:underline">
                Digital Advertising Alliance Opt-Out
              </a>
            </li>
            <li>
              <a href="https://www.youronlinechoices.com/" className="text-primary-600 dark:text-primary-400 hover:underline">
                European Interactive Digital Advertising Alliance
              </a>
            </li>
          </ul>
        </Section>

        <Section
          id="contact"
          title="8. Contact Us About Cookies"
          expanded={expandedSections.has('contact')}
          onToggle={() => toggleSection('contact')}
        >
          <p className="mb-4">
            If you have questions about our use of cookies or this Cookie Policy, please contact us:
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <p className="mb-2"><strong>ApplyForUs, Inc.</strong></p>
            <p className="mb-2">Privacy Team</p>
            <p className="mb-2">Email: privacy@applyforus.com</p>
            <p className="mb-2">Cookie Questions: cookies@applyforus.com</p>
            <p>Mailing Address: [Physical Address to be added]</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Related Policies:</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/do-not-sell" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Do Not Sell My Personal Information
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last Updated: December 14, 2024<br />
              Version 1.0<br />
              © {new Date().getFullYear()} ApplyForUs, Inc. All rights reserved.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  expanded,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm print:shadow-none">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors print:hidden"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <div className={`px-6 pb-6 ${expanded ? 'block' : 'hidden'} print:block`}>
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function CookieTypeCard({
  title,
  icon,
  required,
  description,
  examples,
}: {
  title: string;
  icon: React.ReactNode;
  required: boolean;
  description: string;
  examples: string[];
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            {icon}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
        </div>
        {required && (
          <span className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
            Required
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{description}</p>
      <div>
        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Examples:</p>
        <ul className="space-y-1">
          {examples.map((example, index) => (
            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
              <span className="mr-2">•</span>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
