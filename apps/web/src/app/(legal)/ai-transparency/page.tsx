'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Brain,
  Eye,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Cpu,
  MessageCircle,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS AI TRANSPARENCY POLICY

   Version: 1.0.0
   Last Updated: December 2024

   This document explains:
   - Where AI is used in ApplyForUs
   - What AI does and does not decide
   - Human oversight guarantees
   - User rights regarding AI
   ============================================ */

export default function AITransparencyPage() {
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
              AI Transparency
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-electricGreen/10 text-electricGreen mb-6">
            <Brain className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            AI Transparency <span className="text-electricGreen">Policy</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We believe in being transparent about how we use AI. This document explains where AI is used, what it decides, and how humans remain in control.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Version 1.0.0</span>
            <span>|</span>
            <span>Last Updated: December 2024</span>
          </div>
        </div>

        {/* Plain Language Summary */}
        <div className="bg-electricGreen/10 border border-electricGreen/30 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-bold text-electricGreen mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Plain Language Summary
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span><strong>AI helps, humans decide:</strong> AI optimizes your applications, but you control what jobs to apply for and can override any AI suggestion.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span><strong>No hidden decisions:</strong> We tell you exactly when and how AI is being used.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span><strong>Your data stays yours:</strong> AI processes your data to help you, not to sell to others.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
              <span><strong>You can opt out:</strong> You can disable AI features and use the platform manually.</span>
            </li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <Section
            icon={<Cpu className="w-6 h-6" />}
            title="1. Where AI Is Used"
            defaultOpen={true}
          >
            <div className="space-y-6">
              <p className="text-gray-300">
                ApplyForUs uses artificial intelligence in several key areas to help you find and apply for jobs more effectively:
              </p>

              <AIFeatureCard
                title="Resume Optimization"
                description="AI analyzes your resume and tailors it to match specific job descriptions, highlighting relevant skills and experience."
                aiRole="Suggests modifications to your resume content"
                humanRole="You review and approve all changes before they're applied"
              />

              <AIFeatureCard
                title="Job Matching"
                description="AI compares your profile with job listings to find the best matches based on your skills, experience, and preferences."
                aiRole="Ranks and recommends job opportunities"
                humanRole="You set preferences and decide which jobs to apply for"
              />

              <AIFeatureCard
                title="Application Autofill"
                description="AI pre-fills job application forms with your information, saving time on repetitive data entry."
                aiRole="Extracts and formats your information for forms"
                humanRole="You review all autofilled data before submission"
              />

              <AIFeatureCard
                title="Cover Letter Generation"
                description="AI drafts personalized cover letters based on your profile and the job description."
                aiRole="Creates initial draft content"
                humanRole="You edit, modify, or rewrite before sending"
              />

              <AIFeatureCard
                title="Interview Preparation"
                description="AI suggests potential interview questions and helps you prepare responses."
                aiRole="Generates practice questions and tips"
                humanRole="You decide how to prepare and what to study"
              />
            </div>
          </Section>

          <Section
            icon={<AlertTriangle className="w-6 h-6" />}
            title="2. What AI Does NOT Do"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                To be clear about the boundaries of AI in our platform:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">AI does NOT make hiring decisions</strong>
                    <p className="text-gray-400 text-sm mt-1">We help you apply; employers make all hiring decisions independently.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">AI does NOT guarantee job offers</strong>
                    <p className="text-gray-400 text-sm mt-1">Our tools improve your chances, but outcomes depend on many factors.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">AI does NOT provide legal or employment advice</strong>
                    <p className="text-gray-400 text-sm mt-1">Consult qualified professionals for legal, tax, or employment law questions.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">AI does NOT submit applications without your consent</strong>
                    <p className="text-gray-400 text-sm mt-1">You must explicitly enable auto-apply; all settings are under your control.</p>
                  </div>
                </li>
              </ul>
            </div>
          </Section>

          <Section
            icon={<Users className="w-6 h-6" />}
            title="3. Human Oversight Guarantees"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                We maintain human oversight at every critical point:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-softBlack rounded-xl border border-white/10">
                  <h4 className="font-semibold text-neonYellow mb-2">Review Before Submit</h4>
                  <p className="text-sm text-gray-400">You can review every application before it's submitted, even with auto-apply enabled.</p>
                </div>
                <div className="p-4 bg-softBlack rounded-xl border border-white/10">
                  <h4 className="font-semibold text-neonYellow mb-2">Override AI Suggestions</h4>
                  <p className="text-sm text-gray-400">You can modify, reject, or override any AI-generated content or suggestion.</p>
                </div>
                <div className="p-4 bg-softBlack rounded-xl border border-white/10">
                  <h4 className="font-semibold text-neonYellow mb-2">Pause Anytime</h4>
                  <p className="text-sm text-gray-400">You can pause or stop auto-apply at any time with immediate effect.</p>
                </div>
                <div className="p-4 bg-softBlack rounded-xl border border-white/10">
                  <h4 className="font-semibold text-neonYellow mb-2">Human Support</h4>
                  <p className="text-sm text-gray-400">Our human support team is available to help with any AI-related concerns.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section
            icon={<Shield className="w-6 h-6" />}
            title="4. AI Safety & Ethics"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                We are committed to responsible AI development and use:
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                  <span><strong>Bias Testing:</strong> Our AI models undergo regular testing to identify and mitigate potential biases related to gender, ethnicity, age, and other protected characteristics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                  <span><strong>Data Minimization:</strong> We only use the data necessary for providing our services.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                  <span><strong>No Discriminatory Profiling:</strong> AI is not used to profile users based on protected characteristics.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                  <span><strong>Continuous Improvement:</strong> We continuously update our AI systems to improve accuracy and fairness.</span>
                </li>
              </ul>
            </div>
          </Section>

          <Section
            icon={<Eye className="w-6 h-6" />}
            title="5. Your Rights Regarding AI"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                You have specific rights when it comes to AI processing of your data:
              </p>
              <div className="space-y-3">
                <RightItem
                  title="Right to Explanation"
                  description="You can request an explanation of how AI-generated recommendations were made."
                />
                <RightItem
                  title="Right to Opt Out"
                  description="You can disable AI features and use the platform with manual controls only."
                />
                <RightItem
                  title="Right to Human Review"
                  description="You can request human review of any AI decision that affects you."
                />
                <RightItem
                  title="Right to Correction"
                  description="You can correct any inaccurate AI-generated content about you."
                />
                <RightItem
                  title="Right to Data Access"
                  description="You can access all data used by our AI systems about you."
                />
              </div>
            </div>
          </Section>

          <Section
            icon={<MessageCircle className="w-6 h-6" />}
            title="6. Contact Us About AI"
          >
            <div className="space-y-4">
              <p className="text-gray-300">
                If you have questions about our AI practices or want to exercise your rights:
              </p>
              <div className="bg-softBlack rounded-xl p-6 border border-white/10">
                <p className="text-gray-400 mb-4">
                  <strong className="text-white">AI Ethics Team</strong><br />
                  Email: ai-ethics@applyforus.com<br />
                  Response Time: Within 5 business days
                </p>
                <p className="text-sm text-gray-500">
                  For general support, visit our <Link href="/contact" className="text-neonYellow hover:underline">Contact Page</Link>.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-softBlack rounded-2xl border border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            This AI Transparency Policy is part of our commitment to responsible AI. We update this document as our AI capabilities evolve.
            Last review: December 2024.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/privacy" className="text-neonYellow hover:underline text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-neonYellow hover:underline text-sm">Terms of Service</Link>
            <Link href="/contact" className="text-neonYellow hover:underline text-sm">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Section Component
function Section({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-softBlack/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="text-neonYellow">{icon}</div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

// AI Feature Card
function AIFeatureCard({
  title,
  description,
  aiRole,
  humanRole,
}: {
  title: string;
  description: string;
  aiRole: string;
  humanRole: string;
}) {
  return (
    <div className="p-4 bg-softBlack rounded-xl border border-white/10">
      <h4 className="font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-3 bg-electricGreen/10 rounded-lg border border-electricGreen/20">
          <div className="text-xs font-mono text-electricGreen mb-1">AI Role</div>
          <p className="text-sm text-gray-300">{aiRole}</p>
        </div>
        <div className="p-3 bg-neonYellow/10 rounded-lg border border-neonYellow/20">
          <div className="text-xs font-mono text-neonYellow mb-1">Your Role</div>
          <p className="text-sm text-gray-300">{humanRole}</p>
        </div>
      </div>
    </div>
  );
}

// Right Item
function RightItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-softBlack rounded-xl border border-white/10">
      <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
      <div>
        <strong className="text-white">{title}</strong>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
