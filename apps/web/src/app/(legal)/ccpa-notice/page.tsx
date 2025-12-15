'use client';

import Link from 'next/link';
import { Bot, Shield, FileText, CheckCircle2, AlertCircle, Users, Database, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS CCPA NOTICE AT COLLECTION

   Version: 1.0.0
   Last Updated: December 2024

   California Consumer Privacy Act (CCPA) and
   California Privacy Rights Act (CPRA) compliance
   notice provided at or before the point of
   collection of personal information.
   ============================================ */

export default function CCPANoticePage() {
  return (
    <div className="min-h-screen bg-deepBlack text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-softBlack/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neonYellow to-electricGreen flex items-center justify-center">
                <Bot className="w-6 h-6 text-deepBlack" />
              </div>
              <span className="text-xl font-bold">
                Apply<span className="text-neonYellow">ForUs</span>
              </span>
            </Link>
            <Badge className="bg-neonYellow/10 text-neonYellow border-neonYellow/30">
              CCPA Notice
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            CCPA Notice at <span className="text-neonYellow">Collection</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Information about the personal information we collect from California residents and how we use it.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last Updated: December 2024
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-bold text-neonYellow mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            California Residents: Your Privacy Rights
          </h2>
          <p className="text-gray-300 mb-4">
            Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), you have specific rights regarding your personal information:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span>Right to know what personal information we collect</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span>Right to delete your personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span>Right to correct inaccurate personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span>Right to opt-out of sale/sharing of personal information</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span>Right to limit use of sensitive personal information</span>
            </li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Categories of Information */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-neonYellow" />
              Categories of Personal Information Collected
            </h2>
            <p className="text-gray-300 mb-6">
              We collect the following categories of personal information:
            </p>
            <div className="space-y-4">
              <CategoryItem
                category="Identifiers"
                examples="Name, email address, account username, IP address, device identifiers"
                purpose="Account creation, authentication, service delivery"
              />
              <CategoryItem
                category="Professional Information"
                examples="Employment history, education, skills, resume content, job preferences"
                purpose="Job matching, resume optimization, application submission"
              />
              <CategoryItem
                category="Internet Activity"
                examples="Browsing history on our site, interactions with features, search queries"
                purpose="Service improvement, personalization, analytics"
              />
              <CategoryItem
                category="Geolocation Data"
                examples="Approximate location based on IP address, location preferences for jobs"
                purpose="Local job recommendations, regional compliance"
              />
              <CategoryItem
                category="Inferences"
                examples="Job fit scores, skill assessments, career recommendations"
                purpose="AI-powered job matching and recommendations"
              />
              <CategoryItem
                category="Sensitive Personal Information"
                examples="Account login credentials, precise geolocation (if enabled)"
                purpose="Account security, enhanced location-based features (with consent)"
              />
            </div>
          </section>

          {/* Purposes of Collection */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-electricGreen" />
              Purposes for Collection
            </h2>
            <p className="text-gray-300 mb-4">
              We collect personal information for the following business and commercial purposes:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Providing Services:</strong> Creating accounts, processing job applications, generating resumes and cover letters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Personalization:</strong> Matching you with relevant job opportunities based on your profile and preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Communication:</strong> Sending job alerts, application updates, and service notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Security:</strong> Protecting accounts, detecting fraud, and ensuring platform safety</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Improvement:</strong> Analyzing usage patterns to improve our services and AI models</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Legal Compliance:</strong> Meeting regulatory requirements and responding to legal requests</span>
              </li>
            </ul>
          </section>

          {/* Sale and Sharing */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-neonYellow" />
              Sale and Sharing of Personal Information
            </h2>
            <div className="bg-electricGreen/10 border border-electricGreen/30 rounded-xl p-4 mb-4">
              <p className="text-electricGreen font-semibold">
                ApplyForUs does NOT sell your personal information for monetary consideration.
              </p>
            </div>
            <p className="text-gray-300 mb-4">
              We may share personal information with the following categories of third parties for business purposes:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Employers:</strong> When you apply for jobs (with your consent)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Service Providers:</strong> Cloud hosting, payment processing, email delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Analytics Partners:</strong> To improve our services (aggregated/anonymized)</span>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-deepBlack/50 rounded-xl">
              <p className="text-sm text-gray-400">
                To opt-out of sharing for cross-context behavioral advertising, visit our{' '}
                <Link href="/do-not-sell" className="text-neonYellow hover:underline">
                  Do Not Sell or Share My Personal Information
                </Link>{' '}
                page.
              </p>
            </div>
          </section>

          {/* Retention */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-electricGreen" />
              Retention of Personal Information
            </h2>
            <p className="text-gray-300 mb-4">
              We retain personal information for as long as necessary to:
            </p>
            <ul className="space-y-2 text-gray-300 mb-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Provide our services while your account is active</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Comply with legal obligations (typically 3-7 years)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Resolve disputes and enforce agreements</span>
              </li>
            </ul>
            <p className="text-gray-400 text-sm">
              When you delete your account, we delete or anonymize your personal information within 45 days, except as required by law.
            </p>
          </section>

          {/* Your Rights */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Your CCPA/CPRA Rights</h2>
            <div className="space-y-4">
              <RightCard
                title="Right to Know"
                description="Request information about what personal information we've collected, used, disclosed, or sold about you."
              />
              <RightCard
                title="Right to Delete"
                description="Request deletion of your personal information, subject to certain exceptions."
              />
              <RightCard
                title="Right to Correct"
                description="Request correction of inaccurate personal information we maintain about you."
              />
              <RightCard
                title="Right to Opt-Out"
                description="Opt-out of the sale or sharing of your personal information for cross-context behavioral advertising."
              />
              <RightCard
                title="Right to Limit Use"
                description="Limit our use of sensitive personal information to what's necessary for providing services."
              />
              <RightCard
                title="Right to Non-Discrimination"
                description="We will not discriminate against you for exercising any of your CCPA rights."
              />
            </div>
          </section>

          {/* How to Exercise Rights */}
          <section className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">How to Exercise Your Rights</h2>
            <p className="text-gray-300 mb-4">
              California residents can submit requests through the following methods:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Online Request Form</h4>
                <p className="text-sm text-gray-400">
                  <Link href="/privacy/request" className="text-neonYellow hover:underline">
                    Submit a Privacy Request
                  </Link>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Email</h4>
                <p className="text-sm text-gray-400">
                  <a href="mailto:privacy@applyforus.com" className="text-neonYellow hover:underline">
                    privacy@applyforus.com
                  </a>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Toll-Free Number</h4>
                <p className="text-sm text-gray-400">
                  1-800-APPLY-US (1-800-277-5987)
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              We will verify your identity before processing requests. You may also designate an authorized agent to submit requests on your behalf.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/do-not-sell" className="text-neonYellow hover:underline">Do Not Sell</Link>
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/contact" className="text-neonYellow hover:underline">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function CategoryItem({ category, examples, purpose }: { category: string; examples: string; purpose: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-neonYellow mb-2">{category}</h4>
      <p className="text-sm text-gray-400 mb-1"><strong>Examples:</strong> {examples}</p>
      <p className="text-sm text-gray-400"><strong>Purpose:</strong> {purpose}</p>
    </div>
  );
}

function RightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
      <div>
        <strong className="text-white">{title}</strong>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}
