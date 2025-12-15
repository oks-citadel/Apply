'use client';

import Link from 'next/link';
import { Bot, Shield, AlertTriangle, CheckCircle2, XCircle, Users, FileText, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS SAFETY & RESPONSIBLE USE POLICY

   Version: 1.0.0
   Last Updated: December 2024

   This policy outlines:
   - Acceptable use of the platform
   - Prohibited activities
   - Safety measures
   - Reporting mechanisms
   ============================================ */

export default function SafetyPage() {
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
              Safety Policy
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-6">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Safety & Responsible <span className="text-neonYellow">Use Policy</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our commitment to maintaining a safe, fair, and trustworthy platform for all users.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last Updated: December 2024
          </div>
        </div>

        {/* Summary */}
        <div className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-bold text-neonYellow mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Our Safety Commitment
          </h2>
          <p className="text-gray-300">
            ApplyForUs is committed to providing a safe, secure, and ethical platform for job seekers worldwide. We actively work to prevent misuse, protect user data, and ensure our AI systems are used responsibly.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Acceptable Use */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-electricGreen" />
              Acceptable Use
            </h2>
            <p className="text-gray-300 mb-4">
              ApplyForUs should be used for legitimate job search activities:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Searching for employment opportunities that match your skills and experience</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Creating and optimizing your resume and cover letters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Applying to jobs you are genuinely interested in and qualified for</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Using AI tools to prepare for interviews and improve your applications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Tracking your job applications and managing your job search</span>
              </li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              Prohibited Activities
            </h2>
            <p className="text-gray-300 mb-4">
              The following activities are strictly prohibited:
            </p>
            <div className="space-y-3">
              <ProhibitedItem
                title="Fraudulent Applications"
                description="Applying to jobs with false information, fake credentials, or misrepresented qualifications."
              />
              <ProhibitedItem
                title="Spam Applications"
                description="Mass applying to jobs without genuine intent or qualifications, wasting employers' time."
              />
              <ProhibitedItem
                title="Identity Fraud"
                description="Using someone else's identity, resume, or credentials to apply for jobs."
              />
              <ProhibitedItem
                title="Data Harvesting"
                description="Collecting job posting data, employer information, or user data for unauthorized purposes."
              />
              <ProhibitedItem
                title="Platform Abuse"
                description="Attempting to manipulate, exploit, or circumvent our systems and security measures."
              />
              <ProhibitedItem
                title="Discrimination"
                description="Using the platform in any way that discriminates based on protected characteristics."
              />
              <ProhibitedItem
                title="Illegal Activities"
                description="Using the platform for any purpose that violates applicable laws or regulations."
              />
            </div>
          </section>

          {/* AI Responsible Use */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Bot className="w-6 h-6 text-neonYellow" />
              Responsible AI Use
            </h2>
            <p className="text-gray-300 mb-4">
              When using our AI-powered features:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Review AI-generated content:</strong> Always review and verify AI-generated resumes and cover letters before submission.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Ensure accuracy:</strong> Make sure all information in your applications is truthful and accurate.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Personalize content:</strong> Add your personal touch to AI-generated content to reflect your authentic voice.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Respect employers:</strong> Only apply to positions you're genuinely interested in pursuing.</span>
              </li>
            </ul>
          </section>

          {/* Safety Measures */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-electricGreen" />
              Our Safety Measures
            </h2>
            <p className="text-gray-300 mb-4">
              We implement multiple layers of protection:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <SafetyCard
                title="Fraud Detection"
                description="AI-powered systems detect suspicious patterns and fraudulent activity."
              />
              <SafetyCard
                title="Rate Limiting"
                description="Controls prevent excessive or abusive use of our services."
              />
              <SafetyCard
                title="Identity Verification"
                description="Email verification and optional 2FA protect your account."
              />
              <SafetyCard
                title="Content Moderation"
                description="AI-generated content is filtered for harmful or inappropriate material."
              />
              <SafetyCard
                title="Employer Verification"
                description="We verify job postings to reduce scam and fraudulent listings."
              />
              <SafetyCard
                title="Data Protection"
                description="Enterprise-grade encryption and security protect your information."
              />
            </div>
          </section>

          {/* Reporting */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Flag className="w-6 h-6 text-neonYellow" />
              Reporting Concerns
            </h2>
            <p className="text-gray-300 mb-4">
              If you encounter any safety concerns or policy violations:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Report a Safety Issue</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Email: <a href="mailto:safety@applyforus.com" className="text-neonYellow hover:underline">safety@applyforus.com</a>
                </p>
                <p className="text-xs text-gray-500">For urgent safety concerns, we respond within 24 hours.</p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Report Fraudulent Job Posting</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Use the "Report" button on any job listing, or email: <a href="mailto:report@applyforus.com" className="text-neonYellow hover:underline">report@applyforus.com</a>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">Report Abuse</h4>
                <p className="text-sm text-gray-400 mb-2">
                  Email: <a href="mailto:abuse@applyforus.com" className="text-neonYellow hover:underline">abuse@applyforus.com</a>
                </p>
              </div>
            </div>
          </section>

          {/* Enforcement */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Enforcement
            </h2>
            <p className="text-gray-300 mb-4">
              Violations of this policy may result in:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Warning:</strong> First-time or minor violations may receive a warning.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <span><strong>Temporary Suspension:</strong> Repeated or moderate violations may result in temporary account suspension.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Permanent Ban:</strong> Severe or repeated violations will result in permanent account termination.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>Legal Action:</strong> Illegal activities may be reported to law enforcement.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            This policy is part of our Terms of Service. We may update it periodically to address new risks and requirements.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/ai-transparency" className="text-neonYellow hover:underline">AI Transparency</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProhibitedItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <strong className="text-white">{title}</strong>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function SafetyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
