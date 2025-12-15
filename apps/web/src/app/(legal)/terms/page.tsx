'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version 1.0 | Last Updated: December 14, 2024 | Effective Date: December 14, 2024
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Plain Language Summary
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• You must be 16+ to use ApplyForUs</li>
            <li>• You're responsible for keeping your account secure</li>
            <li>• We provide AI tools to help with job applications, but you're responsible for your content</li>
            <li>• You own your content; we need a license to provide services</li>
            <li>• We can suspend accounts that violate these terms</li>
            <li>• Services are provided "as is" without warranties</li>
            <li>• Disputes are resolved through arbitration (where applicable)</li>
          </ul>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Important Arbitration Notice
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                These Terms contain an arbitration clause and class action waiver that affects your rights.
                Please read Section 14 carefully. You have the right to opt-out within 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          {[
            { id: 'acceptance', title: '1. Acceptance of Terms' },
            { id: 'eligibility', title: '2. Eligibility' },
            { id: 'account', title: '3. Account Registration and Security' },
            { id: 'services', title: '4. Description of Services' },
            { id: 'user-content', title: '5. User Content and Ownership' },
            { id: 'acceptable-use', title: '6. Acceptable Use Policy' },
            { id: 'prohibited', title: '7. Prohibited Activities' },
            { id: 'intellectual-property', title: '8. Intellectual Property Rights' },
            { id: 'payment', title: '9. Payment and Subscriptions' },
            { id: 'third-party', title: '10. Third-Party Services' },
            { id: 'disclaimers', title: '11. Disclaimers and Warranties' },
            { id: 'limitation', title: '12. Limitation of Liability' },
            { id: 'indemnification', title: '13. Indemnification' },
            { id: 'dispute-resolution', title: '14. Dispute Resolution and Arbitration' },
            { id: 'termination', title: '15. Termination' },
            { id: 'modifications', title: '16. Modifications to Terms' },
            { id: 'general', title: '17. General Provisions' },
            { id: 'contact', title: '18. Contact Information' },
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

      {/* Terms Content */}
      <div className="space-y-6">
        <Section
          id="acceptance"
          title="1. Acceptance of Terms"
          expanded={expandedSections.has('acceptance')}
          onToggle={() => toggleSection('acceptance')}
        >
          <p className="mb-4">
            Welcome to ApplyForUs. These Terms of Service ("Terms") constitute a legally binding agreement between
            you ("you," "your," or "User") and ApplyForUs, Inc. ("ApplyForUs," "we," "our," or "us") governing your
            access to and use of the ApplyForUs website, mobile applications, and related services (collectively, the "Services").
          </p>
          <p className="mb-4">
            BY ACCESSING OR USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND
            BY THESE TERMS AND OUR PRIVACY POLICY. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE SERVICES.
          </p>
          <p>
            We may update these Terms from time to time. Your continued use of the Services after changes are posted
            constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section
          id="eligibility"
          title="2. Eligibility"
          expanded={expandedSections.has('eligibility')}
          onToggle={() => toggleSection('eligibility')}
        >
          <p className="mb-4">To use our Services, you must:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Be at least 16 years of age (or the age of digital consent in your jurisdiction)</li>
            <li>Have the legal capacity to enter into a binding agreement</li>
            <li>Not be barred from using the Services under applicable law</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
          <p className="mb-4">
            If you are using the Services on behalf of an organization, you represent and warrant that you have the
            authority to bind that organization to these Terms.
          </p>
          <p>
            We reserve the right to refuse service, terminate accounts, or cancel subscriptions in our sole discretion.
          </p>
        </Section>

        <Section
          id="account"
          title="3. Account Registration and Security"
          expanded={expandedSections.has('account')}
          onToggle={() => toggleSection('account')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.1 Account Creation</h3>
          <p className="mb-4">
            To access certain features, you must create an account. When creating an account, you agree to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Not share your account with others</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.2 Account Security</h3>
          <p className="mb-4">
            You are responsible for all activities that occur under your account. We recommend:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Using a strong, unique password</li>
            <li>Enabling two-factor authentication when available</li>
            <li>Not sharing your login credentials with anyone</li>
            <li>Logging out from shared or public devices</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.3 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason
            at our sole discretion, with or without notice.
          </p>
        </Section>

        <Section
          id="services"
          title="4. Description of Services"
          expanded={expandedSections.has('services')}
          onToggle={() => toggleSection('services')}
        >
          <p className="mb-4">ApplyForUs provides the following services:</p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.1 AI-Powered Resume Builder</h3>
          <p className="mb-4">
            Tools to create, customize, and optimize resumes using artificial intelligence and machine learning.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.2 Cover Letter Generation</h3>
          <p className="mb-4">
            AI-powered generation of personalized cover letters tailored to specific job postings.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.3 Job Search and Application Tracking</h3>
          <p className="mb-4">
            Job discovery tools and application tracking features to manage your job search.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.4 Application Automation</h3>
          <p className="mb-4">
            Features to streamline and automate aspects of the job application process.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.5 Analytics and Insights</h3>
          <p className="mb-4">
            Analytics tools to track application success rates and optimize your job search strategy.
          </p>

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <strong>Important Notice:</strong> We provide tools to assist with job applications, but we do not guarantee
            job placement, interviews, or employment outcomes. The effectiveness of AI-generated content may vary.
            You are solely responsible for reviewing and approving all content before submission to employers.
          </p>
        </Section>

        <Section
          id="user-content"
          title="5. User Content and Ownership"
          expanded={expandedSections.has('user-content')}
          onToggle={() => toggleSection('user-content')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.1 Your Content</h3>
          <p className="mb-4">
            "User Content" means any information, data, text, documents, resumes, cover letters, or other materials
            you submit, upload, or create through the Services.
          </p>
          <p className="mb-4">You retain all ownership rights to your User Content. However, you grant us:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>
              A worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display
              your User Content solely to provide and improve the Services
            </li>
            <li>
              The right to use anonymized and aggregated data derived from your User Content for analytics, research,
              and service improvement
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.2 Content Representations</h3>
          <p className="mb-4">By submitting User Content, you represent and warrant that:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>You own or have the necessary rights to the content</li>
            <li>The content is accurate and not misleading</li>
            <li>The content does not violate any third-party rights</li>
            <li>The content complies with applicable laws and these Terms</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5.3 AI-Generated Content</h3>
          <p className="mb-4">
            Content generated by our AI tools is provided as suggestions. You are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Reviewing all AI-generated content for accuracy and appropriateness</li>
            <li>Ensuring content is truthful and not misleading</li>
            <li>Verifying that content complies with employer requirements</li>
            <li>Making final decisions about content use and submission</li>
          </ul>
        </Section>

        <Section
          id="acceptable-use"
          title="6. Acceptable Use Policy"
          expanded={expandedSections.has('acceptable-use')}
          onToggle={() => toggleSection('acceptable-use')}
        >
          <p className="mb-4">You agree to use the Services only for lawful purposes and in accordance with these Terms. You agree:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>To provide truthful and accurate information in your applications</li>
            <li>Not to misrepresent your qualifications, experience, or credentials</li>
            <li>Not to submit false, misleading, or fraudulent information to employers</li>
            <li>To comply with all applicable laws and regulations</li>
            <li>To respect the intellectual property rights of others</li>
            <li>Not to use the Services to harass, abuse, or harm others</li>
            <li>Not to interfere with or disrupt the Services or servers</li>
          </ul>
        </Section>

        <Section
          id="prohibited"
          title="7. Prohibited Activities"
          expanded={expandedSections.has('prohibited')}
          onToggle={() => toggleSection('prohibited')}
        >
          <p className="mb-4">The following activities are strictly prohibited:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Creating fake or fraudulent resumes or credentials</li>
            <li>Impersonating another person or entity</li>
            <li>Submitting false or misleading information to employers</li>
            <li>Scraping, data mining, or automated data collection</li>
            <li>Reverse engineering or attempting to access our source code</li>
            <li>Circumventing security measures or access controls</li>
            <li>Transmitting viruses, malware, or harmful code</li>
            <li>Using the Services for any illegal purpose</li>
            <li>Violating any applicable laws or regulations</li>
            <li>Interfering with other users' access to the Services</li>
            <li>Creating multiple accounts to abuse free trials or promotions</li>
            <li>Reselling or redistributing the Services without authorization</li>
          </ul>
          <p>
            Violation of these prohibitions may result in immediate account termination and potential legal action.
          </p>
        </Section>

        <Section
          id="intellectual-property"
          title="8. Intellectual Property Rights"
          expanded={expandedSections.has('intellectual-property')}
          onToggle={() => toggleSection('intellectual-property')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8.1 Our Intellectual Property</h3>
          <p className="mb-4">
            The Services, including all software, algorithms, designs, graphics, text, and other content (excluding
            User Content), are owned by ApplyForUs and protected by copyright, trademark, and other intellectual
            property laws.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8.2 Limited License</h3>
          <p className="mb-4">
            We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services
            for your personal, non-commercial use, subject to these Terms.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8.3 Trademarks</h3>
          <p className="mb-4">
            "ApplyForUs" and our logos are trademarks of ApplyForUs, Inc. You may not use our trademarks without
            prior written permission.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8.4 Feedback</h3>
          <p>
            If you provide feedback, suggestions, or ideas about the Services, we may use them without any obligation
            to you.
          </p>
        </Section>

        <Section
          id="payment"
          title="9. Payment and Subscriptions"
          expanded={expandedSections.has('payment')}
          onToggle={() => toggleSection('payment')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.1 Subscription Plans</h3>
          <p className="mb-4">
            We offer free and paid subscription plans. Paid plans are billed on a recurring basis (monthly or annually)
            until canceled.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.2 Payment Terms</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Subscription fees are charged in advance on a recurring basis</li>
            <li>You authorize us to charge your payment method on file</li>
            <li>You are responsible for all applicable taxes</li>
            <li>All fees are non-refundable except as required by law</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.3 Price Changes</h3>
          <p className="mb-4">
            We may change subscription prices with 30 days' notice. Changes apply to subsequent billing periods.
            You may cancel if you don't accept the new pricing.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.4 Cancellation and Refunds</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>You may cancel your subscription at any time through your account settings</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
            <li>No refunds or credits for partial periods</li>
            <li>Refunds may be provided at our discretion for specific circumstances</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.5 Free Trials</h3>
          <p>
            Free trial periods may be offered. You may be charged automatically when the trial ends unless you cancel
            before the trial expiration date. One free trial per user.
          </p>
        </Section>

        <Section
          id="third-party"
          title="10. Third-Party Services and Links"
          expanded={expandedSections.has('third-party')}
          onToggle={() => toggleSection('third-party')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10.1 Third-Party Services</h3>
          <p className="mb-4">
            Our Services may integrate with third-party services (job boards, OAuth providers, payment processors).
            Your use of third-party services is subject to their terms and privacy policies.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10.2 Third-Party Links</h3>
          <p className="mb-4">
            We may provide links to third-party websites. We do not endorse and are not responsible for the content,
            accuracy, or practices of third-party sites.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10.3 AI Service Providers</h3>
          <p>
            We use third-party AI services (OpenAI, Anthropic) to provide certain features. These providers have their
            own terms and privacy policies that may apply to the processing of your data.
          </p>
        </Section>

        <Section
          id="disclaimers"
          title="11. Disclaimers and Warranties"
          expanded={expandedSections.has('disclaimers')}
          onToggle={() => toggleSection('disclaimers')}
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
              Important Legal Notice
            </p>
          </div>

          <p className="mb-4">
            THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
            <li>Warranties regarding availability, reliability, accuracy, or completeness</li>
            <li>Warranties that the Services will be error-free or uninterrupted</li>
            <li>Warranties regarding the security of data transmission</li>
          </ul>

          <p className="mb-4">WE SPECIFICALLY DISCLAIM ANY WARRANTIES THAT:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Use of our Services will result in job offers, interviews, or employment</li>
            <li>AI-generated content will meet employer requirements or expectations</li>
            <li>Job listings or employer information is accurate or current</li>
            <li>Third-party services will function as expected</li>
          </ul>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Some jurisdictions do not allow the exclusion of certain warranties. In such cases, the above exclusions
            may not apply to you to the extent prohibited by law.
          </p>
        </Section>

        <Section
          id="limitation"
          title="12. Limitation of Liability"
          expanded={expandedSections.has('limitation')}
          onToggle={() => toggleSection('limitation')}
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
              Important Legal Notice
            </p>
          </div>

          <p className="mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, APPLYFORUS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
            SHALL NOT BE LIABLE FOR:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">12.1 Indirect Damages</h3>
          <p className="mb-4">
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Lost profits, revenue, or business opportunities</li>
            <li>Loss of data or information</li>
            <li>Cost of substitute services</li>
            <li>Reputational harm</li>
            <li>Failure to secure employment</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">12.2 Maximum Liability</h3>
          <p className="mb-4">
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES
            SHALL NOT EXCEED THE GREATER OF:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>The amount you paid to us in the 12 months preceding the claim, or</li>
            <li>$100 USD</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">12.3 Exceptions</h3>
          <p className="mb-4">
            These limitations do not apply to liability that cannot be excluded or limited by law, including:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Death or personal injury caused by negligence</li>
            <li>Fraud or fraudulent misrepresentation</li>
            <li>Willful misconduct</li>
            <li>Violations of consumer protection laws</li>
          </ul>
        </Section>

        <Section
          id="indemnification"
          title="13. Indemnification"
          expanded={expandedSections.has('indemnification')}
          onToggle={() => toggleSection('indemnification')}
        >
          <p className="mb-4">
            You agree to indemnify, defend, and hold harmless ApplyForUs and its officers, directors, employees,
            agents, and affiliates from and against any claims, liabilities, damages, losses, and expenses
            (including reasonable attorneys' fees) arising out of or related to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Your use or misuse of the Services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another person or entity</li>
            <li>Your User Content</li>
            <li>Any false, misleading, or fraudulent information you provide</li>
            <li>Your violation of applicable laws or regulations</li>
          </ul>
          <p>
            We reserve the right to assume exclusive defense and control of any matter subject to indemnification,
            at your expense.
          </p>
        </Section>

        <Section
          id="dispute-resolution"
          title="14. Dispute Resolution and Arbitration"
          expanded={expandedSections.has('dispute-resolution')}
          onToggle={() => toggleSection('dispute-resolution')}
        >
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  IMPORTANT - PLEASE READ CAREFULLY
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This section affects your legal rights, including your right to file a lawsuit in court and to have
                  a jury hear your claims. You have the right to opt-out of arbitration as described below.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.1 Informal Dispute Resolution</h3>
          <p className="mb-4">
            Before filing a claim, you agree to contact us at legal@applyforus.com to attempt to resolve the dispute
            informally. We will attempt to resolve disputes within 60 days.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.2 Binding Arbitration (US Users)</h3>
          <p className="mb-4">
            For users in the United States, any dispute arising out of or relating to these Terms or the Services
            will be resolved through binding arbitration, except as noted below.
          </p>
          <p className="mb-4"><strong>Arbitration Rules:</strong></p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Administered by the American Arbitration Association (AAA)</li>
            <li>Conducted under AAA's Consumer Arbitration Rules</li>
            <li>Arbitrator's decision is final and binding</li>
            <li>Limited discovery and streamlined procedures</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.3 Class Action Waiver</h3>
          <p className="mb-4">
            YOU AND APPLYFORUS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL
            CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.4 Exceptions to Arbitration</h3>
          <p className="mb-4">Either party may bring a claim in small claims court or seek injunctive relief in court for:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Intellectual property infringement</li>
            <li>Unauthorized access to the Services</li>
            <li>Violations of the Computer Fraud and Abuse Act</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.5 Opt-Out Right</h3>
          <p className="mb-4">
            You may opt-out of arbitration by sending written notice to legal@applyforus.com within 30 days of
            accepting these Terms. Your notice must include your name, address, and a clear statement that you wish
            to opt-out of arbitration.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">14.6 International Users</h3>
          <p>
            For users outside the United States, disputes will be resolved in accordance with the laws and courts
            of your jurisdiction, subject to mandatory consumer protection laws.
          </p>
        </Section>

        <Section
          id="termination"
          title="15. Termination"
          expanded={expandedSections.has('termination')}
          onToggle={() => toggleSection('termination')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">15.1 Termination by You</h3>
          <p className="mb-4">
            You may terminate your account at any time by:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Accessing account settings and selecting "Delete Account"</li>
            <li>Contacting support@applyforus.com</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">15.2 Termination by Us</h3>
          <p className="mb-4">
            We may suspend or terminate your account immediately if:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>You violate these Terms</li>
            <li>Your account is inactive for 12+ months</li>
            <li>We're required to do so by law</li>
            <li>Providing the Services becomes unlawful or impractical</li>
            <li>We suspect fraudulent, abusive, or illegal activity</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">15.3 Effect of Termination</h3>
          <p className="mb-4">Upon termination:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Your right to access the Services immediately ceases</li>
            <li>We may delete your account and User Content</li>
            <li>No refunds will be provided for unused subscription time (except as required by law)</li>
            <li>Sections that by their nature should survive termination will remain in effect</li>
          </ul>
        </Section>

        <Section
          id="modifications"
          title="16. Modifications to Terms and Services"
          expanded={expandedSections.has('modifications')}
          onToggle={() => toggleSection('modifications')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">16.1 Changes to Terms</h3>
          <p className="mb-4">
            We may modify these Terms at any time. When we make material changes:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>We'll update the "Last Updated" date</li>
            <li>We'll notify you via email or in-app notification</li>
            <li>Changes take effect 30 days after notification (or immediately for legal reasons)</li>
            <li>Your continued use after changes constitutes acceptance</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">16.2 Changes to Services</h3>
          <p className="mb-4">
            We may modify, suspend, or discontinue any aspect of the Services at any time, with or without notice.
            We are not liable for any modification, suspension, or discontinuation.
          </p>
        </Section>

        <Section
          id="general"
          title="17. General Provisions"
          expanded={expandedSections.has('general')}
          onToggle={() => toggleSection('general')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.1 Governing Law</h3>
          <p className="mb-4">
            These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict
            of law principles. International users retain rights under their local consumer protection laws.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.2 Entire Agreement</h3>
          <p className="mb-4">
            These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between
            you and ApplyForUs regarding the Services.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.3 Severability</h3>
          <p className="mb-4">
            If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in
            full force and effect.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.4 Waiver</h3>
          <p className="mb-4">
            Our failure to enforce any provision does not waive our right to enforce it later.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.5 Assignment</h3>
          <p className="mb-4">
            You may not assign these Terms without our prior written consent. We may assign these Terms without
            restriction.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.6 No Agency</h3>
          <p className="mb-4">
            These Terms do not create any agency, partnership, joint venture, or employment relationship.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.7 Force Majeure</h3>
          <p className="mb-4">
            We are not liable for delays or failures due to circumstances beyond our reasonable control.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">17.8 Export Controls</h3>
          <p>
            You agree to comply with all applicable export and re-export control laws and regulations.
          </p>
        </Section>

        <Section
          id="contact"
          title="18. Contact Information"
          expanded={expandedSections.has('contact')}
          onToggle={() => toggleSection('contact')}
        >
          <p className="mb-4">
            If you have questions about these Terms, please contact us:
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <p className="mb-2"><strong>ApplyForUs, Inc.</strong></p>
            <p className="mb-2">Legal Department</p>
            <p className="mb-2">Email: legal@applyforus.com</p>
            <p className="mb-2">Support: support@applyforus.com</p>
            <p>Mailing Address: [Physical Address to be added]</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
