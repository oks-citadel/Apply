/* ============================================
   POLICY TEMPLATES

   Handlebars-based templates for generating
   region-specific policy documents.
   ============================================ */

import Handlebars from 'handlebars';
import { PolicyType, PolicyVariables } from './types';

/**
 * Register Handlebars helpers
 */
Handlebars.registerHelper('ifEquals', function(arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifIncludes', function(arr: unknown[], item: unknown, options: Handlebars.HelperOptions) {
  return Array.isArray(arr) && arr.includes(item) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('join', function(arr: unknown[], separator: string) {
  return Array.isArray(arr) ? arr.join(separator) : '';
});

Handlebars.registerHelper('formatDate', function(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
});

/**
 * Privacy Policy Template
 */
export const PRIVACY_POLICY_TEMPLATE = `
# Privacy Policy

**Effective Date:** {{effectiveDate}}
**Last Updated:** {{lastUpdated}}

## Introduction

{{companyName}} ("{{companyLegalName}}", "we", "us", or "our") operates the {{companyWebsite}} website and provides job application automation services (collectively, the "Service"). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal information when you use our Service.

{{#ifEquals region "EU"}}
This policy is provided in accordance with the EU General Data Protection Regulation (GDPR).
{{/ifEquals}}

{{#ifEquals region "UK"}}
This policy is provided in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
{{/ifEquals}}

{{#ifEquals region "US_CA"}}
This policy includes disclosures required under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA).
{{/ifEquals}}

{{#ifEquals region "BR"}}
This policy is provided in accordance with Brazil's Lei Geral de Proteção de Dados (LGPD).
{{/ifEquals}}

## Information We Collect

### Personal Information You Provide

When you create an account or use our Service, you may provide us with:

{{#each dataCategories}}
- {{this}}
{{/each}}

{{#if sensitiveDataCategories}}
### Sensitive Personal Information

We may collect the following categories of sensitive personal information:

{{#each sensitiveDataCategories}}
- {{this}}
{{/each}}
{{/if}}

### Information Collected Automatically

We automatically collect certain information when you use our Service, including:

- Device information (browser type, operating system, device identifiers)
- Log data (IP address, access times, pages viewed)
- Usage data (features used, interactions with the Service)
- Location data (approximate location based on IP address)

{{#if hasAnalytics}}
### Analytics and Cookies

We use analytics services and cookies to understand how you use our Service. See our Cookie Policy for more details.
{{/if}}

## How We Use Your Information

We use the information we collect for the following purposes:

{{#each processingPurposes}}
- {{this}}
{{/each}}

{{#ifEquals region "EU"}}
### Legal Basis for Processing (EU/UK)

Under GDPR, we process your personal data based on the following legal bases:

- **Contractual Necessity**: Processing necessary for the performance of our contract with you
- **Legitimate Interests**: Processing necessary for our legitimate business interests
- **Consent**: Where you have given clear consent for specific processing activities
- **Legal Obligation**: Processing necessary to comply with legal requirements
{{/ifEquals}}

{{#ifEquals region "UK"}}
### Legal Basis for Processing (UK)

Under UK GDPR, we process your personal data based on the following legal bases:

- **Contractual Necessity**: Processing necessary for the performance of our contract with you
- **Legitimate Interests**: Processing necessary for our legitimate business interests
- **Consent**: Where you have given clear consent for specific processing activities
- **Legal Obligation**: Processing necessary to comply with legal requirements
{{/ifEquals}}

## Data Sharing and Disclosure

We may share your information with:

{{#each thirdPartyRecipients}}
- {{this}}
{{/each}}

### Sub-Processors

We engage the following sub-processors to process data on our behalf:

| Sub-Processor | Purpose | Location |
|---------------|---------|----------|
{{#each subProcessors}}
| {{name}} | {{purpose}} | {{location}} |
{{/each}}

## Data Retention

We retain your personal information for as long as necessary to:

{{#each dataRetentionPeriods}}
- **{{@key}}**: {{this}}
{{/each}}

## Your Rights

{{#ifEquals region "EU"}}
### Your GDPR Rights

Under GDPR, you have the following rights:

- **Right to Access**: Request a copy of your personal data
- **Right to Rectification**: Request correction of inaccurate data
- **Right to Erasure**: Request deletion of your data ("right to be forgotten")
- **Right to Restrict Processing**: Request limitation of data processing
- **Right to Data Portability**: Receive your data in a portable format
- **Right to Object**: Object to processing based on legitimate interests
- **Right to Withdraw Consent**: Withdraw consent at any time

To exercise these rights, contact us at {{privacyEmail}}.

You also have the right to lodge a complaint with {{dataProtectionAuthorityName}} at {{dataProtectionAuthorityUrl}}.
{{/ifEquals}}

{{#ifEquals region "UK"}}
### Your UK GDPR Rights

Under UK GDPR, you have the following rights:

- **Right to Access**: Request a copy of your personal data
- **Right to Rectification**: Request correction of inaccurate data
- **Right to Erasure**: Request deletion of your data
- **Right to Restrict Processing**: Request limitation of data processing
- **Right to Data Portability**: Receive your data in a portable format
- **Right to Object**: Object to processing based on legitimate interests
- **Right to Withdraw Consent**: Withdraw consent at any time

To exercise these rights, contact us at {{privacyEmail}}.

You may also complain to the Information Commissioner's Office (ICO) at https://ico.org.uk.
{{/ifEquals}}

{{#ifEquals region "US_CA"}}
### Your California Privacy Rights

Under CCPA/CPRA, California residents have the following rights:

- **Right to Know**: Request information about data collection and use
- **Right to Delete**: Request deletion of personal information
- **Right to Correct**: Request correction of inaccurate information
- **Right to Opt-Out**: Opt-out of sale/sharing of personal information
- **Right to Limit**: Limit use of sensitive personal information
- **Right to Non-Discrimination**: Not be discriminated against for exercising rights

To exercise these rights, visit our Do Not Sell page or contact us at {{privacyEmail}}.
{{/ifEquals}}

{{#ifEquals region "US_WA"}}
### Your Washington Privacy Rights

Under the Washington My Health My Data Act, you have specific rights regarding health data:

- **Right to Know**: Know what health data is collected
- **Right to Delete**: Request deletion of health data
- **Right to Withdraw Consent**: Withdraw consent for health data processing

We do not use geofencing around healthcare facilities.
{{/ifEquals}}

## International Data Transfers

{{#ifEquals region "EU"}}
When we transfer personal data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, including:

- EU Commission Standard Contractual Clauses (SCCs)
- Adequacy decisions where applicable
- Supplementary technical and organizational measures
{{/ifEquals}}

{{#ifEquals region "UK"}}
When we transfer personal data outside the United Kingdom, we ensure appropriate safeguards are in place, including:

- UK International Data Transfer Agreement (IDTA)
- Adequacy regulations where applicable
- Supplementary technical and organizational measures
{{/ifEquals}}

## Security

We implement appropriate technical and organizational measures to protect your personal information, including:

- Encryption at rest and in transit (AES-256, TLS 1.3)
- Access controls and authentication
- Regular security assessments and penetration testing
- Employee security training

{{#if hasAI}}
## AI and Automated Decision-Making

Our Service uses artificial intelligence to:

- Generate optimized resumes and cover letters
- Match you with relevant job opportunities
- Automate job application submissions

**Important**: All AI-generated content should be reviewed by you before use. We do not make fully automated decisions with legal or significant effects without human oversight.

For more information, see our AI Transparency Statement.
{{/if}}

## Children's Privacy

Our Service is not directed to individuals under 16 years of age. We do not knowingly collect personal information from children under 16.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **Email**: {{privacyEmail}}
- **Address**: {{companyAddress}}
{{#if dpoEmail}}
- **Data Protection Officer**: {{dpoEmail}}
{{/if}}

---

© {{currentYear}} {{companyLegalName}}. All rights reserved.
`;

/**
 * Terms of Service Template
 */
export const TERMS_OF_SERVICE_TEMPLATE = `
# Terms of Service

**Effective Date:** {{effectiveDate}}
**Last Updated:** {{lastUpdated}}

## 1. Acceptance of Terms

By accessing or using the {{companyName}} service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.

## 2. Description of Service

{{companyName}} provides an AI-powered job application automation platform that helps users:

- Create and optimize resumes and cover letters
- Search and discover job opportunities
- Automate job application submissions
- Track application status and progress

{{#if hasSubscriptions}}
## 3. Subscription and Payment

### Subscription Tiers

We offer various subscription tiers with different features and usage limits. See our Subscription Terms for details.

### Payment

- Subscriptions are billed in advance on a monthly or annual basis
- Payment is processed through secure third-party payment processors
- All fees are non-refundable except as stated in our refund policy

### Cancellation

You may cancel your subscription at any time. Your subscription will remain active until the end of the current billing period.
{{/if}}

## 4. User Accounts

### Account Creation

- You must provide accurate and complete information when creating an account
- You are responsible for maintaining the security of your account credentials
- You must notify us immediately of any unauthorized use of your account

### Account Responsibilities

- You are responsible for all activities that occur under your account
- You must not share your account with others
- You must not create multiple accounts for the purpose of circumventing usage limits

## 5. Acceptable Use

You agree NOT to:

- Use the Service for any unlawful purpose
- Submit false or misleading information in job applications
- Apply to jobs you are not genuinely interested in or qualified for
- Attempt to circumvent usage limits or rate limiting
- Scrape, harvest, or collect data from the Service
- Interfere with or disrupt the Service or servers
- Upload malicious code or content
- Impersonate another person or entity

## 6. Intellectual Property

### Our Intellectual Property

The Service, including its original content, features, and functionality, is owned by {{companyLegalName}} and is protected by international copyright, trademark, and other intellectual property laws.

### Your Content

You retain ownership of content you submit to the Service (resumes, cover letters, profile information). By submitting content, you grant us a license to use, store, and process it to provide the Service.

{{#if hasAI}}
### AI-Generated Content

Content generated by our AI is provided to you with a perpetual, royalty-free license. You are responsible for reviewing and verifying the accuracy of AI-generated content before use.
{{/if}}

## 7. Third-Party Services

The Service may integrate with third-party job boards and services. We are not responsible for the practices or content of third-party services. Your use of third-party services is subject to their respective terms and policies.

## 8. Disclaimers

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.

We do not guarantee:

- That the Service will be uninterrupted or error-free
- That job applications will result in employment
- The accuracy of job listings from third-party sources
- That AI-generated content will be error-free

## 9. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, {{companyLegalName}} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.

Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.

## 10. Indemnification

You agree to indemnify and hold harmless {{companyLegalName}} from any claims, damages, or expenses arising from:

- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Content you submit to the Service

## 11. Termination

We may terminate or suspend your account immediately, without prior notice, for:

- Violation of these Terms
- Fraudulent or abusive use of the Service
- Non-payment of fees
- At our sole discretion for any reason

Upon termination, your right to use the Service will cease immediately.

## 12. Governing Law

{{#ifEquals region "US"}}
These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
{{/ifEquals}}

{{#ifEquals region "UK"}}
These Terms shall be governed by and construed in accordance with the laws of England and Wales.
{{/ifEquals}}

{{#ifEquals region "EU"}}
These Terms shall be governed by and construed in accordance with the laws of Ireland.
{{/ifEquals}}

{{#ifEquals region "GLOBAL"}}
These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
{{/ifEquals}}

## 13. Dispute Resolution

Any disputes arising from these Terms shall be resolved through:

1. Good faith negotiation
2. Binding arbitration (for users in the US)
3. Courts of competent jurisdiction

## 14. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last Updated" date.

## 15. Severability

If any provision of these Terms is held to be unenforceable, the remaining provisions will continue in full force and effect.

## 16. Contact Us

If you have any questions about these Terms, please contact us:

- **Email**: {{legalEmail}}
- **Address**: {{companyAddress}}

---

© {{currentYear}} {{companyLegalName}}. All rights reserved.
`;

/**
 * Cookie Policy Template
 */
export const COOKIE_POLICY_TEMPLATE = `
# Cookie Policy

**Effective Date:** {{effectiveDate}}
**Last Updated:** {{lastUpdated}}

## What Are Cookies?

Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.

## How We Use Cookies

{{companyName}} uses cookies and similar technologies for the following purposes:

### Essential Cookies

These cookies are necessary for the website to function properly. They include:

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| session_id | Maintains your login session | Session |
| csrf_token | Security - prevents cross-site request forgery | Session |
| cookie_consent | Remembers your cookie preferences | 1 year |

### Functional Cookies

These cookies enable enhanced functionality and personalization:

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| language | Remembers your language preference | 1 year |
| theme | Remembers your theme preference (dark/light) | 1 year |
| recent_searches | Stores recent job searches | 30 days |

### Analytics Cookies

We use analytics cookies to understand how visitors interact with our website:

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| _ga | Google Analytics - distinguishes users | 2 years |
| _gid | Google Analytics - distinguishes users | 24 hours |
| mixpanel | Mixpanel analytics | 1 year |

### Marketing Cookies

{{#if hasThirdPartyIntegrations}}
We may use marketing cookies to deliver relevant advertisements:

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| _fbp | Facebook Pixel | 3 months |
| _gcl_au | Google Ads conversion tracking | 3 months |
{{else}}
We do not currently use marketing or advertising cookies.
{{/if}}

## Managing Cookies

{{#ifEquals region "EU"}}
### EU Cookie Consent

In accordance with EU ePrivacy regulations, we request your consent before placing non-essential cookies on your device. You can manage your cookie preferences through our cookie consent banner.
{{/ifEquals}}

{{#ifEquals region "UK"}}
### UK Cookie Consent

In accordance with UK PECR regulations, we request your consent before placing non-essential cookies on your device. You can manage your cookie preferences through our cookie consent banner.
{{/ifEquals}}

### Browser Settings

Most web browsers allow you to control cookies through their settings. You can:

- Block all cookies
- Allow only first-party cookies
- Delete cookies when you close your browser
- Browse in "private" or "incognito" mode

Please note that blocking cookies may affect the functionality of our Service.

### Browser-Specific Instructions

- **Chrome**: Settings > Privacy and security > Cookies and other site data
- **Firefox**: Options > Privacy & Security > Cookies and Site Data
- **Safari**: Preferences > Privacy > Cookies and website data
- **Edge**: Settings > Cookies and site permissions > Cookies and site data

## Third-Party Cookies

Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. For more information, please refer to the privacy policies of these third parties.

## Updates to This Policy

We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.

## Contact Us

If you have any questions about our use of cookies, please contact us:

- **Email**: {{privacyEmail}}
- **Address**: {{companyAddress}}

---

© {{currentYear}} {{companyLegalName}}. All rights reserved.
`;

/**
 * Template registry
 */
export const POLICY_TEMPLATES: Record<PolicyType, string> = {
  privacy: PRIVACY_POLICY_TEMPLATE,
  terms: TERMS_OF_SERVICE_TEMPLATE,
  cookies: COOKIE_POLICY_TEMPLATE,
  dpa: '', // Data Processing Agreement template
  ccpa_notice: '', // CCPA Notice template
  do_not_sell: '', // Do Not Sell template
  health_data: '', // Health Data template
  ai_transparency: '', // AI Transparency template
  modern_slavery: '', // Modern Slavery template
  accessibility: '', // Accessibility template
  subscription_terms: '', // Subscription Terms template
  ip_dmca: '', // IP/DMCA template
};

/**
 * Compile a policy template with variables
 */
export function compileTemplate(policyType: PolicyType, variables: PolicyVariables): string {
  const template = POLICY_TEMPLATES[policyType];
  if (!template) {
    throw new Error(`Template not found for policy type: ${policyType}`);
  }

  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(variables);
}

/**
 * Get available template types
 */
export function getAvailableTemplates(): PolicyType[] {
  return Object.keys(POLICY_TEMPLATES).filter(
    (key) => POLICY_TEMPLATES[key as PolicyType] !== ''
  ) as PolicyType[];
}
