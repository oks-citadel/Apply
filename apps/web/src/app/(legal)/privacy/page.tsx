'use client';

import { useState } from 'react';
import { Globe, Download, ChevronDown, ChevronUp } from 'lucide-react';

type Region = 'us' | 'eu' | 'uk' | 'canada' | 'australia' | 'nigeria';

const regions: { value: Region; label: string; flag: string }[] = [
  { value: 'us', label: 'United States (CCPA/CPRA)', flag: '🇺🇸' },
  { value: 'eu', label: 'European Union (GDPR)', flag: '🇪🇺' },
  { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'canada', label: 'Canada (PIPEDA)', flag: '🇨🇦' },
  { value: 'australia', label: 'Australia', flag: '🇦🇺' },
  { value: 'nigeria', label: 'Nigeria (NDPR)', flag: '🇳🇬' },
];

export default function PrivacyPolicyPage() {
  const [selectedRegion, setSelectedRegion] = useState<Region>('us');
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
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

        {/* Region Selector */}
        <div className="mt-6 print:hidden">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="w-4 h-4 inline mr-2" />
            Select Your Region for Specific Privacy Rights
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as Region)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.flag} {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Plain Language Summary */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 p-6 rounded-r-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Plain Language Summary
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• We collect information you provide and usage data to deliver our job application services</li>
            <li>• We use AI to process your resumes and applications, but you control your data</li>
            <li>• We don't sell your personal information to third parties</li>
            <li>• You can access, update, or delete your data at any time</li>
            <li>• We use industry-standard security to protect your information</li>
            <li>• We comply with GDPR, CCPA, PIPEDA, and other privacy laws</li>
          </ul>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 print:shadow-none">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Table of Contents</h2>
        <nav className="grid md:grid-cols-2 gap-2">
          {[
            { id: 'introduction', title: '1. Introduction' },
            { id: 'information-we-collect', title: '2. Information We Collect' },
            { id: 'how-we-use', title: '3. How We Use Your Information' },
            { id: 'sharing', title: '4. Information Sharing and Disclosure' },
            { id: 'data-retention', title: '5. Data Retention' },
            { id: 'security', title: '6. Security Measures' },
            { id: 'your-rights', title: '7. Your Privacy Rights' },
            { id: 'cookies', title: '8. Cookies and Tracking' },
            { id: 'international', title: '9. International Data Transfers' },
            { id: 'children', title: '10. Children\'s Privacy' },
            { id: 'changes', title: '11. Changes to This Policy' },
            { id: 'contact', title: '12. Contact Information' },
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
          id="introduction"
          title="1. Introduction"
          expanded={expandedSections.has('introduction')}
          onToggle={() => toggleSection('introduction')}
        >
          <p className="mb-4">
            Welcome to ApplyForUs ("we," "our," or "us"). We are committed to protecting your privacy and
            ensuring transparency in how we collect, use, and safeguard your personal information.
          </p>
          <p className="mb-4">
            This Privacy Policy describes our practices concerning the personal information we collect through
            our website at applyforus.com and our related services (collectively, the "Services"). By accessing
            or using our Services, you agree to this Privacy Policy.
          </p>
          <p>
            <strong>Controller Information:</strong><br />
            ApplyForUs, Inc.<br />
            Email: privacy@applyforus.com<br />
            Data Protection Officer: dpo@applyforus.com
          </p>
        </Section>

        <Section
          id="information-we-collect"
          title="2. Information We Collect"
          expanded={expandedSections.has('information-we-collect')}
          onToggle={() => toggleSection('information-we-collect')}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2.1 Information You Provide</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
            <li><strong>Profile Information:</strong> Professional background, work experience, education, skills</li>
            <li><strong>Resume Data:</strong> Employment history, educational qualifications, certifications, achievements</li>
            <li><strong>Application Data:</strong> Cover letters, job preferences, salary expectations</li>
            <li><strong>Payment Information:</strong> Billing details, payment card information (processed by third-party payment processors)</li>
            <li><strong>Communications:</strong> Messages sent through our platform, customer support inquiries</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2.2 Automatically Collected Information</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the platform, search queries</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Location Data:</strong> General geographic location based on IP address</li>
            <li><strong>Cookies and Similar Technologies:</strong> See our Cookie Policy for details</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2.3 Information from Third Parties</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Job boards and employment websites (when you connect your accounts)</li>
            <li>OAuth providers (Google, LinkedIn, Microsoft) for authentication</li>
            <li>Public databases and professional networking sites</li>
          </ul>
        </Section>

        <Section
          id="how-we-use"
          title="3. How We Use Your Information"
          expanded={expandedSections.has('how-we-use')}
          onToggle={() => toggleSection('how-we-use')}
        >
          <p className="mb-4">We use your personal information for the following purposes:</p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.1 Service Delivery</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Creating and managing your account</li>
            <li>Generating AI-powered resume customizations and cover letters</li>
            <li>Tracking and managing your job applications</li>
            <li>Providing personalized job recommendations</li>
            <li>Processing payments and maintaining billing records</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.2 AI and Machine Learning</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Training our AI models to improve resume optimization</li>
            <li>Analyzing job descriptions to match with your profile</li>
            <li>Generating personalized content (cover letters, resume summaries)</li>
            <li>Providing intelligent application insights and analytics</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.3 Communication</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Sending service updates and notifications</li>
            <li>Responding to your inquiries and support requests</li>
            <li>Sending marketing communications (with your consent)</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3.4 Legal Basis (GDPR)</h3>
          <p className="mb-2">For users in the EU/UK, we process your data based on:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Contract Performance:</strong> To provide our services</li>
            <li><strong>Legitimate Interests:</strong> To improve our services and prevent fraud</li>
            <li><strong>Legal Obligations:</strong> To comply with applicable laws</li>
            <li><strong>Consent:</strong> For marketing communications and optional features</li>
          </ul>
        </Section>

        <Section
          id="sharing"
          title="4. Information Sharing and Disclosure"
          expanded={expandedSections.has('sharing')}
          onToggle={() => toggleSection('sharing')}
        >
          <p className="mb-4">
            <strong>We do not sell your personal information.</strong> We may share your information in the following circumstances:
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.1 With Your Consent</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>When you apply to jobs through our platform, we share your application materials with employers</li>
            <li>When you explicitly authorize sharing with third-party services</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.2 Service Providers</h3>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Cloud hosting providers (AWS, Azure, Google Cloud)</li>
            <li>AI and machine learning service providers (OpenAI, Anthropic)</li>
            <li>Payment processors (Stripe, PayPal)</li>
            <li>Email service providers</li>
            <li>Analytics providers</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.3 Legal Requirements</h3>
          <p className="mb-4">We may disclose information if required by law or in response to:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Valid legal processes (subpoenas, court orders)</li>
            <li>Government or regulatory requests</li>
            <li>Protection of our rights, property, or safety</li>
            <li>Prevention of fraud or security threats</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4.4 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale of assets, your information may be transferred
            to the acquiring entity. We will notify you of any such change in ownership.
          </p>
        </Section>

        <Section
          id="data-retention"
          title="5. Data Retention"
          expanded={expandedSections.has('data-retention')}
          onToggle={() => toggleSection('data-retention')}
        >
          <p className="mb-4">We retain your personal information for as long as necessary to:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Provide our services to you</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
          </ul>
          <p className="mb-4"><strong>Specific Retention Periods:</strong></p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Active Accounts:</strong> Data retained while account is active</li>
            <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days; some data retained for legal compliance (up to 7 years)</li>
            <li><strong>Application History:</strong> Retained for 2 years after last activity</li>
            <li><strong>Marketing Data:</strong> Retained until you withdraw consent</li>
          </ul>
        </Section>

        <Section
          id="security"
          title="6. Security Measures"
          expanded={expandedSections.has('security')}
          onToggle={() => toggleSection('security')}
        >
          <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
            <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
            <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
            <li><strong>Incident Response:</strong> 24/7 monitoring and incident response procedures</li>
            <li><strong>Data Minimization:</strong> We collect only necessary information</li>
            <li><strong>Secure Development:</strong> Security-first development practices</li>
          </ul>
          <p>
            While we strive to protect your information, no security system is impenetrable. We cannot
            guarantee absolute security of your data.
          </p>
        </Section>

        <RegionalRightsSection region={selectedRegion} />

        <Section
          id="cookies"
          title="8. Cookies and Tracking Technologies"
          expanded={expandedSections.has('cookies')}
          onToggle={() => toggleSection('cookies')}
        >
          <p className="mb-4">
            We use cookies and similar technologies to enhance your experience. For detailed information,
            please see our <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">Cookie Policy</a>.
          </p>
          <p className="mb-4"><strong>Types of Cookies We Use:</strong></p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
            <li><strong>Performance Cookies:</strong> Help us understand usage patterns</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences</li>
            <li><strong>Analytics Cookies:</strong> Measure and improve our services</li>
          </ul>
        </Section>

        <Section
          id="international"
          title="9. International Data Transfers"
          expanded={expandedSections.has('international')}
          onToggle={() => toggleSection('international')}
        >
          <p className="mb-4">
            ApplyForUs operates globally. Your information may be transferred to and processed in countries
            other than your country of residence, including the United States.
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.1 EU to US Transfers</h3>
          <p className="mb-4">
            We comply with applicable data transfer mechanisms, including:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>EU Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the European Commission</li>
            <li>Your explicit consent where required</li>
          </ul>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9.2 Other Transfers</h3>
          <p>
            For transfers from other regions, we implement appropriate safeguards consistent with local laws,
            including PIPEDA (Canada), Privacy Act (Australia), and NDPR (Nigeria).
          </p>
        </Section>

        <Section
          id="children"
          title="10. Children's Privacy"
          expanded={expandedSections.has('children')}
          onToggle={() => toggleSection('children')}
        >
          <p className="mb-4">
            Our Services are not intended for individuals under the age of 16 (or the applicable age of
            digital consent in your jurisdiction). We do not knowingly collect personal information from children.
          </p>
          <p>
            If we become aware that we have collected personal information from a child without parental consent,
            we will take steps to delete that information promptly.
          </p>
        </Section>

        <Section
          id="changes"
          title="11. Changes to This Privacy Policy"
          expanded={expandedSections.has('changes')}
          onToggle={() => toggleSection('changes')}
        >
          <p className="mb-4">
            We may update this Privacy Policy from time to time. When we make material changes, we will:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Update the "Last Updated" date at the top of this policy</li>
            <li>Notify you via email or through our platform</li>
            <li>Obtain your consent if required by applicable law</li>
          </ul>
          <p>
            Your continued use of our Services after changes become effective constitutes acceptance of
            the updated Privacy Policy.
          </p>
        </Section>

        <Section
          id="contact"
          title="12. Contact Information"
          expanded={expandedSections.has('contact')}
          onToggle={() => toggleSection('contact')}
        >
          <p className="mb-4">
            If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices,
            please contact us:
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <p className="mb-2"><strong>ApplyForUs, Inc.</strong></p>
            <p className="mb-2">Privacy Team</p>
            <p className="mb-2">Email: privacy@applyforus.com</p>
            <p className="mb-2">Data Protection Officer: dpo@applyforus.com</p>
            <p className="mb-4">Mailing Address: [Physical Address to be added]</p>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <strong>For EU/UK Users:</strong> You have the right to lodge a complaint with your local
              supervisory authority if you believe we have not adequately addressed your privacy concerns.
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

function RegionalRightsSection({ region }: { region: Region }) {
  const rightsContent = {
    us: {
      title: '7. Your Privacy Rights (United States - CCPA/CPRA)',
      content: (
        <>
          <p className="mb-4">
            If you are a California resident, you have specific rights under the California Consumer Privacy Act
            (CCPA) and California Privacy Rights Act (CPRA):
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right to Know</h3>
          <p className="mb-2">You have the right to request:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Categories of personal information we collect</li>
            <li>Specific pieces of personal information we hold about you</li>
            <li>Sources from which we collect information</li>
            <li>Business or commercial purposes for collection</li>
            <li>Categories of third parties with whom we share information</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right to Delete</h3>
          <p className="mb-4">
            You can request deletion of your personal information, subject to certain exceptions (e.g., legal obligations,
            fraud prevention, security).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Opt-Out</h3>
          <p className="mb-4">
            You have the right to opt-out of the sale or sharing of your personal information. We do not sell your
            personal information. See our <a href="/do-not-sell" className="text-primary-600 dark:text-primary-400 hover:underline">Do Not Sell My Personal Information</a> page.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Correct</h3>
          <p className="mb-4">You can request correction of inaccurate personal information.</p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 Right to Limit Use of Sensitive Personal Information</h3>
          <p className="mb-4">
            You can limit our use of sensitive personal information to what is necessary to provide services.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.6 Non-Discrimination</h3>
          <p className="mb-4">
            We will not discriminate against you for exercising your privacy rights.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.7 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact us at:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: privacy@applyforus.com</li>
            <li>In-app privacy settings</li>
            <li>Support: <a href="https://applyforus.com/support" className="text-primary-600 dark:text-primary-400 hover:underline">Contact Support</a></li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We will respond to verifiable requests within 45 days.
          </p>
        </>
      ),
    },
    eu: {
      title: '7. Your Privacy Rights (European Union - GDPR)',
      content: (
        <>
          <p className="mb-4">
            Under the General Data Protection Regulation (GDPR), you have the following rights:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right of Access</h3>
          <p className="mb-4">
            You can request confirmation of whether we process your personal data and obtain a copy of your data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right to Rectification</h3>
          <p className="mb-4">
            You can request correction of inaccurate or incomplete personal data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Erasure (Right to be Forgotten)</h3>
          <p className="mb-4">
            You can request deletion of your personal data in certain circumstances.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Restriction of Processing</h3>
          <p className="mb-4">
            You can request that we limit how we use your data in certain situations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 Right to Data Portability</h3>
          <p className="mb-4">
            You can receive your data in a structured, commonly used, machine-readable format and transfer it to another controller.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.6 Right to Object</h3>
          <p className="mb-4">
            You can object to processing based on legitimate interests or for direct marketing purposes.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.7 Right to Withdraw Consent</h3>
          <p className="mb-4">
            Where processing is based on consent, you can withdraw it at any time.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.8 Right to Lodge a Complaint</h3>
          <p className="mb-4">
            You can lodge a complaint with your local supervisory authority.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.9 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact our Data Protection Officer:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: dpo@applyforus.com</li>
            <li>In-app privacy settings</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We will respond to requests within one month, extendable by two additional months for complex requests.
          </p>
        </>
      ),
    },
    uk: {
      title: '7. Your Privacy Rights (United Kingdom)',
      content: (
        <>
          <p className="mb-4">
            Under UK GDPR and the Data Protection Act 2018, you have the following rights:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right of Access</h3>
          <p className="mb-4">
            You can request a copy of your personal data (Subject Access Request).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right to Rectification</h3>
          <p className="mb-4">
            You can have inaccurate personal data corrected.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Erasure</h3>
          <p className="mb-4">
            You can request deletion of your personal data in certain circumstances.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Restrict Processing</h3>
          <p className="mb-4">
            You can request that we limit how we process your data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 Right to Data Portability</h3>
          <p className="mb-4">
            You can receive your data in a portable format.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.6 Right to Object</h3>
          <p className="mb-4">
            You can object to processing for direct marketing or based on legitimate interests.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.7 Rights Related to Automated Decision Making</h3>
          <p className="mb-4">
            You have rights regarding automated decisions that have legal or similarly significant effects.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.8 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact us:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: dpo@applyforus.com</li>
            <li>In-app privacy settings</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can also lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.
          </p>
        </>
      ),
    },
    canada: {
      title: '7. Your Privacy Rights (Canada - PIPEDA)',
      content: (
        <>
          <p className="mb-4">
            Under the Personal Information Protection and Electronic Documents Act (PIPEDA), you have the following rights:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right to Know</h3>
          <p className="mb-4">
            You can request information about how we collect, use, and disclose your personal information.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right of Access</h3>
          <p className="mb-4">
            You can access your personal information held by us.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Correction</h3>
          <p className="mb-4">
            You can challenge the accuracy and completeness of your information and have it amended.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Withdraw Consent</h3>
          <p className="mb-4">
            You can withdraw consent for the collection, use, or disclosure of your information, subject to legal restrictions.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 Complaint Rights</h3>
          <p className="mb-4">
            You can file a complaint with the Office of the Privacy Commissioner of Canada if you believe your privacy
            rights have been violated.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.6 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact our Privacy Officer:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: privacy@applyforus.com</li>
            <li>In-app privacy settings</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We will respond to access requests within 30 days.
          </p>
        </>
      ),
    },
    australia: {
      title: '7. Your Privacy Rights (Australia)',
      content: (
        <>
          <p className="mb-4">
            Under the Privacy Act 1988 and Australian Privacy Principles (APPs), you have the following rights:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right to Access</h3>
          <p className="mb-4">
            You can request access to your personal information held by us.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right to Correction</h3>
          <p className="mb-4">
            You can request correction of inaccurate, out-of-date, incomplete, irrelevant, or misleading information.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Complain</h3>
          <p className="mb-4">
            You can lodge a complaint with us or the Office of the Australian Information Commissioner (OAIC).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Anonymity</h3>
          <p className="mb-4">
            Where practicable, you can interact with us anonymously or using a pseudonym.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact our Privacy Officer:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: privacy@applyforus.com</li>
            <li>In-app privacy settings</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We will respond to requests within 30 days. If you're not satisfied with our response, you can contact
            the OAIC at oaic.gov.au.
          </p>
        </>
      ),
    },
    nigeria: {
      title: '7. Your Privacy Rights (Nigeria - NDPR)',
      content: (
        <>
          <p className="mb-4">
            Under the Nigeria Data Protection Regulation (NDPR), you have the following rights:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.1 Right to Information</h3>
          <p className="mb-4">
            You have the right to be informed about the collection and use of your personal data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.2 Right of Access</h3>
          <p className="mb-4">
            You can request access to your personal data and information about how it's being processed.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.3 Right to Rectification</h3>
          <p className="mb-4">
            You can request correction of inaccurate or incomplete personal data.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.4 Right to Erasure</h3>
          <p className="mb-4">
            You can request deletion of your personal data in certain circumstances.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.5 Right to Object</h3>
          <p className="mb-4">
            You can object to the processing of your personal data for direct marketing or other purposes.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.6 Right to Data Portability</h3>
          <p className="mb-4">
            You can receive your personal data in a structured, commonly used format.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.7 Right to Complain</h3>
          <p className="mb-4">
            You can lodge a complaint with the Nigeria Data Protection Commission (NDPC).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7.8 How to Exercise Your Rights</h3>
          <p className="mb-2">Contact our Data Protection Officer:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Email: dpo@applyforus.com</li>
            <li>In-app privacy settings</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We will respond to requests within the timeframe required by NDPR.
          </p>
        </>
      ),
    },
  };

  const { title, content } = rightsContent[region];

  return (
    <Section
      id="your-rights"
      title={title}
      expanded={true}
      onToggle={() => {}}
    >
      {content}
    </Section>
  );
}
