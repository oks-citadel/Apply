'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Eye, Keyboard, Users, MessageCircle } from 'lucide-react';

export default function AccessibilityStatementPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Accessibility Statement</h1>
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

        {/* Commitment Statement */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 p-6 rounded-r-lg">
          <div className="flex items-start space-x-3">
            <Users className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Our Commitment to Accessibility
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                ApplyForUs is committed to ensuring digital accessibility for people with disabilities. We are
                continually improving the user experience for everyone and applying the relevant accessibility standards.
              </p>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>• We strive to conform to WCAG 2.1 Level AA standards</p>
                <p>• We comply with Section 508 and ADA requirements</p>
                <p>• We follow WAI-ARIA authoring practices</p>
                <p>• We regularly test with assistive technologies</p>
                <p>• We welcome feedback to improve accessibility</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          {[
            { id: 'standards', title: '1. Accessibility Standards' },
            { id: 'conformance', title: '2. Conformance Status' },
            { id: 'features', title: '3. Accessibility Features' },
            { id: 'assistive-tech', title: '4. Compatible Technologies' },
            { id: 'known-issues', title: '5. Known Limitations' },
            { id: 'testing', title: '6. Testing and Evaluation' },
            { id: 'improvements', title: '7. Ongoing Improvements' },
            { id: 'feedback', title: '8. Accessibility Feedback' },
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

      {/* Content */}
      <div className="space-y-6">
        <Section
          id="standards"
          title="1. Accessibility Standards"
          expanded={expandedSections.has('standards')}
          onToggle={() => toggleSection('standards')}
        >
          <p className="mb-4">
            ApplyForUs aims to conform to the following accessibility standards and guidelines:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                WCAG 2.1 Level AA (Web Content Accessibility Guidelines)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                We strive to meet Level AA conformance of the World Wide Web Consortium (W3C) Web Content
                Accessibility Guidelines 2.1. These guidelines explain how to make web content more accessible for
                people with disabilities.
              </p>
              <a
                href="https://www.w3.org/WAI/WCAG21/quickref/"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View WCAG 2.1 Guidelines
              </a>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Section 508 (United States)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We aim to comply with Section 508 of the Rehabilitation Act, which requires federal agencies to
                make their electronic and information technology accessible.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ADA (Americans with Disabilities Act)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We are committed to compliance with the Americans with Disabilities Act and ensuring our platform
                is accessible to all users.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                EN 301 549 (European Standard)
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We align with the European accessibility standard for ICT products and services.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="conformance"
          title="2. Conformance Status"
          expanded={expandedSections.has('conformance')}
          onToggle={() => toggleSection('conformance')}
        >
          <p className="mb-4">
            The Web Content Accessibility Guidelines (WCAG) define requirements under three conformance levels:
            A, AA, and AAA. ApplyForUs is <strong>partially conformant</strong> with WCAG 2.1 Level AA.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded-r-lg mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Partially Conformant</strong> means that some parts of the content do not fully conform
              to the accessibility standard. We are actively working to achieve full conformance.
            </p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Current Conformance Level</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Principle</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-3 font-semibold">Perceivable</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Conformant
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Text alternatives, adaptable content</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Operable</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                      Partial
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Keyboard navigation mostly complete</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Understandable</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Conformant
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Clear language, predictable behavior</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Robust</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Conformant
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Compatible with assistive technologies</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          id="features"
          title="3. Accessibility Features"
          expanded={expandedSections.has('features')}
          onToggle={() => toggleSection('features')}
        >
          <p className="mb-4">
            ApplyForUs includes the following accessibility features to ensure an inclusive experience:
          </p>

          <div className="space-y-4">
            <FeatureCard
              icon={<Keyboard className="w-6 h-6" />}
              title="Keyboard Navigation"
              features={[
                'Full keyboard accessibility throughout the platform',
                'Logical tab order following visual layout',
                'Skip navigation links to bypass repetitive content',
                'Keyboard shortcuts for common actions',
                'Visible focus indicators on all interactive elements',
                'No keyboard traps',
              ]}
            />

            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Visual Accessibility"
              features={[
                'High contrast color scheme options',
                'Dark mode support for reduced eye strain',
                'Resizable text up to 200% without loss of functionality',
                'Clear visual focus indicators',
                'Sufficient color contrast ratios (WCAG AA compliant)',
                'No reliance on color alone to convey information',
              ]}
            />

            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Screen Reader Support"
              features={[
                'Semantic HTML for proper structure',
                'ARIA labels and descriptions where needed',
                'Alternative text for all images',
                'Proper heading hierarchy (H1-H6)',
                'Form labels and error messages announced',
                'Status messages and notifications accessible',
              ]}
            />

            <FeatureCard
              icon={<MessageCircle className="w-6 h-6" />}
              title="Content and Language"
              features={[
                'Plain language writing style',
                'Clear and descriptive link text',
                'Consistent navigation and layout',
                'Error prevention and recovery assistance',
                'Helpful form validation messages',
                'Expandable/collapsible sections for easier navigation',
              ]}
            />
          </div>
        </Section>

        <Section
          id="assistive-tech"
          title="4. Compatible Assistive Technologies"
          expanded={expandedSections.has('assistive-tech')}
          onToggle={() => toggleSection('assistive-tech')}
        >
          <p className="mb-4">
            ApplyForUs is designed to be compatible with the following assistive technologies and browsers:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Screen Readers</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">JAWS</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tested with JAWS (Job Access With Speech) on Windows with Chrome and Firefox
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">NVDA</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tested with NVDA (NonVisual Desktop Access) on Windows with Chrome and Firefox
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">VoiceOver</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tested with VoiceOver on macOS with Safari and on iOS with Safari
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">TalkBack</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Tested with TalkBack on Android with Chrome
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Supported Browsers</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Desktop Browsers</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Chrome (latest 2 versions)</li>
                <li>• Firefox (latest 2 versions)</li>
                <li>• Safari (latest 2 versions)</li>
                <li>• Edge (latest 2 versions)</li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mobile Browsers</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Safari on iOS (latest 2 versions)</li>
                <li>• Chrome on Android (latest 2 versions)</li>
                <li>• Samsung Internet (latest version)</li>
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Other Assistive Technologies</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Voice recognition software (Dragon NaturallySpeaking)</li>
            <li>Screen magnification software (ZoomText, Windows Magnifier)</li>
            <li>Browser text-to-speech extensions</li>
            <li>Alternative input devices (switch controls, eye tracking)</li>
          </ul>
        </Section>

        <Section
          id="known-issues"
          title="5. Known Accessibility Limitations"
          expanded={expandedSections.has('known-issues')}
          onToggle={() => toggleSection('known-issues')}
        >
          <p className="mb-4">
            We are transparent about current accessibility limitations and are actively working to address them:
          </p>

          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PDF Resume Generation</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Issue:</strong> Generated PDF resumes may not be fully accessible to screen readers.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Workaround:</strong> We provide HTML and plain text versions of all resumes.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Timeline:</strong> Working on tagged PDF generation - Target: Q2 2025
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Complex Data Visualizations</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Issue:</strong> Some analytics charts may be difficult to interpret with screen readers.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Workaround:</strong> We provide data tables and text summaries for all visualizations.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Timeline:</strong> Improving chart accessibility - Target: Q1 2025
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Third-Party Job Board Integrations</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Issue:</strong> External job application forms may not meet our accessibility standards.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Note:</strong> We cannot control the accessibility of third-party websites and services.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Action:</strong> We're working with partners to improve accessibility across the ecosystem.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Video Content</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Issue:</strong> Some tutorial videos may lack captions or audio descriptions.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Workaround:</strong> Written tutorials are available for all video content.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Timeline:</strong> Adding captions to all videos - Target: Q1 2025
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="testing"
          title="6. Testing and Evaluation Methods"
          expanded={expandedSections.has('testing')}
          onToggle={() => toggleSection('testing')}
        >
          <p className="mb-4">
            We employ multiple methods to ensure and maintain accessibility:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automated Testing</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• axe DevTools for automated accessibility audits</li>
                <li>• Lighthouse accessibility scores</li>
                <li>• WAVE (Web Accessibility Evaluation Tool)</li>
                <li>• Continuous integration accessibility checks</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Manual Testing</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Keyboard-only navigation testing</li>
                <li>• Screen reader testing (JAWS, NVDA, VoiceOver)</li>
                <li>• Browser zoom and text resize testing</li>
                <li>• Color contrast verification</li>
                <li>• Focus management review</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">User Testing</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Regular testing with users with disabilities</li>
                <li>• Accessibility feedback program</li>
                <li>• Usability studies with assistive technology users</li>
                <li>• Beta testing with accessibility advocates</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Third-Party Audits</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                We conduct annual third-party accessibility audits by certified WCAG auditors to identify and
                address accessibility issues.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Last audit: November 2024 | Next scheduled: November 2025
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="improvements"
          title="7. Ongoing Accessibility Improvements"
          expanded={expandedSections.has('improvements')}
          onToggle={() => toggleSection('improvements')}
        >
          <p className="mb-4">
            Accessibility is an ongoing commitment. We are continuously working to improve the accessibility of
            our platform:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Current Initiatives</h3>
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Q1 2025</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Complete keyboard navigation improvements</li>
                <li>• Add captions to all tutorial videos</li>
                <li>• Improve mobile screen reader experience</li>
                <li>• Enhanced high contrast mode</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Q2 2025</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Implement tagged PDF generation for accessible resumes</li>
                <li>• Add dyslexia-friendly font option</li>
                <li>• Improve form error handling and recovery</li>
                <li>• Enhanced ARIA live regions for dynamic content</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Q3-Q4 2025</h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Voice control support</li>
                <li>• Customizable interface options</li>
                <li>• Accessibility preference profiles</li>
                <li>• Achieve WCAG 2.2 Level AA conformance</li>
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Accessibility Team</h3>
          <p className="text-gray-700 dark:text-gray-300">
            We have a dedicated accessibility team including:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
            <li>Accessibility Specialists</li>
            <li>UX Designers trained in inclusive design</li>
            <li>Developers certified in web accessibility</li>
            <li>Quality Assurance testers with accessibility expertise</li>
          </ul>
        </Section>

        <Section
          id="feedback"
          title="8. Accessibility Feedback and Support"
          expanded={expandedSections.has('feedback')}
          onToggle={() => toggleSection('feedback')}
        >
          <p className="mb-4">
            We welcome your feedback on the accessibility of ApplyForUs. If you encounter accessibility barriers,
            please let us know:
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Accessibility Team</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</p>
                <a
                  href="mailto:accessibility@applyforus.com"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  accessibility@applyforus.com
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Support:</p>
                <a href="https://applyforus.com/support" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Contact Support (TTY available)
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Time:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">We aim to respond within 2 business days</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">When Reporting Issues, Please Include:</h3>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Description of the accessibility barrier</li>
            <li>The page or feature where you encountered the issue</li>
            <li>Browser and version you're using</li>
            <li>Assistive technology you're using (if applicable)</li>
            <li>Steps to reproduce the issue</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Alternative Access</h3>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            If you encounter an accessibility barrier that prevents you from accessing features or content,
            we will work with you to provide the information or service in an alternative format:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Personal assistance via phone or email</li>
            <li>Alternative document formats</li>
            <li>Extended time for tasks if needed</li>
            <li>Customized accessibility accommodations</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Formal Complaints</h3>
          <p className="text-gray-700 dark:text-gray-300">
            If you are not satisfied with our response to your accessibility concern, you may file a formal
            complaint:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <strong>US Users:</strong> Department of Justice ADA complaints:{' '}
              <a
                href="https://www.ada.gov/filing_complaint.htm"
                className="text-primary-600 dark:text-primary-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ADA Complaint Form
              </a>
            </li>
            <li>
              <strong>UK Users:</strong> Equality and Human Rights Commission:{' '}
              <a
                href="https://www.equalityhumanrights.com/en"
                className="text-primary-600 dark:text-primary-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                EHRC Website
              </a>
            </li>
            <li>
              <strong>EU Users:</strong> Contact your national equality body</li>
          </ul>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This accessibility statement was last reviewed on December 14, 2024<br />
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

function FeatureCard({
  icon,
  title,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  features: string[];
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          {icon}
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      </div>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
            <span className="mr-2 text-primary-600 dark:text-primary-400">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
