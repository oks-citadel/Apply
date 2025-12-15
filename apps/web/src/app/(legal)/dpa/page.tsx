'use client';

import Link from 'next/link';
import { Bot, Shield, FileText, CheckCircle2, Lock, Database, Globe, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS DATA PROCESSING AGREEMENT

   Version: 1.0.0
   Last Updated: December 2024

   This DPA governs the processing of personal
   data by ApplyForUs on behalf of its users
   and complies with GDPR Article 28 requirements.
   ============================================ */

export default function DPAPage() {
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
              Data Processing Agreement
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-6">
            <Scale className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Data Processing <span className="text-neonYellow">Agreement</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            This Data Processing Agreement ("DPA") forms part of our Terms of Service and governs how we process personal data.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Version 1.0.0 | Effective: December 2024
          </div>
        </div>

        {/* DPA Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-neonYellow" />
              1. Introduction
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This Data Processing Agreement ("DPA") is entered into between ApplyForUs Inc. ("Processor", "we", "us") and the user ("Controller", "you") and forms part of the Terms of Service.
            </p>
            <p className="text-gray-300 leading-relaxed">
              This DPA reflects the parties' agreement with regard to the Processing of Personal Data in accordance with the requirements of Data Protection Laws, including the EU General Data Protection Regulation (GDPR) and other applicable privacy legislation.
            </p>
          </section>

          {/* Definitions */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-electricGreen" />
              2. Definitions
            </h2>
            <div className="space-y-4">
              <DefinitionItem
                term="Personal Data"
                definition="Any information relating to an identified or identifiable natural person."
              />
              <DefinitionItem
                term="Processing"
                definition="Any operation performed on Personal Data, including collection, storage, use, disclosure, or deletion."
              />
              <DefinitionItem
                term="Data Subject"
                definition="The individual to whom the Personal Data relates."
              />
              <DefinitionItem
                term="Sub-processor"
                definition="Any third party engaged by us to process Personal Data on your behalf."
              />
              <DefinitionItem
                term="Data Protection Laws"
                definition="GDPR, UK GDPR, CCPA, and other applicable data protection legislation."
              />
            </div>
          </section>

          {/* Scope and Purpose */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-neonYellow" />
              3. Scope and Purpose of Processing
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We process Personal Data solely for the following purposes:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Providing the ApplyForUs job application automation services</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Generating and optimizing resumes and cover letters using AI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Submitting job applications on your behalf to employers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Tracking and managing your job applications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Improving our services through aggregated analytics</span>
              </li>
            </ul>
          </section>

          {/* Processor Obligations */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-electricGreen" />
              4. Processor Obligations
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              As the Processor, we commit to:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Process only on instructions:</strong> We only process Personal Data based on your documented instructions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Confidentiality:</strong> All personnel processing data are bound by confidentiality obligations.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Security measures:</strong> We implement appropriate technical and organizational measures.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Sub-processor management:</strong> We use only approved sub-processors with equivalent protections.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Assistance:</strong> We assist you in responding to data subject requests and compliance obligations.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Deletion:</strong> Upon termination, we delete or return all Personal Data as requested.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Audit:</strong> We make available information necessary to demonstrate compliance.</span>
              </li>
            </ul>
          </section>

          {/* Security Measures */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-neonYellow" />
              5. Security Measures
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement the following technical and organizational security measures:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <SecurityCard
                title="Encryption"
                description="AES-256 encryption at rest, TLS 1.3 in transit"
              />
              <SecurityCard
                title="Access Controls"
                description="Role-based access, MFA required for all staff"
              />
              <SecurityCard
                title="Network Security"
                description="Firewalls, intrusion detection, DDoS protection"
              />
              <SecurityCard
                title="Monitoring"
                description="24/7 security monitoring and logging"
              />
              <SecurityCard
                title="Incident Response"
                description="Documented procedures with 72-hour notification"
              />
              <SecurityCard
                title="Business Continuity"
                description="Regular backups, disaster recovery plans"
              />
            </div>
          </section>

          {/* Sub-processors */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">6. Sub-processors</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We engage the following categories of sub-processors:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-neonYellow">Sub-processor</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Purpose</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Location</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Microsoft Azure</td>
                    <td className="py-3 px-4">Cloud hosting infrastructure</td>
                    <td className="py-3 px-4">EU/US (configurable)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">OpenAI</td>
                    <td className="py-3 px-4">AI model processing</td>
                    <td className="py-3 px-4">United States</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Stripe</td>
                    <td className="py-3 px-4">Payment processing</td>
                    <td className="py-3 px-4">United States</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">SendGrid</td>
                    <td className="py-3 px-4">Email delivery</td>
                    <td className="py-3 px-4">United States</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Mixpanel</td>
                    <td className="py-3 px-4">Analytics</td>
                    <td className="py-3 px-4">United States</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              You can subscribe to receive notifications of sub-processor changes at{' '}
              <a href="mailto:dpa@applyforus.com" className="text-neonYellow hover:underline">
                dpa@applyforus.com
              </a>
            </p>
          </section>

          {/* International Transfers */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">7. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For transfers of Personal Data outside the European Economic Area (EEA), we rely on:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Standard Contractual Clauses (SCCs):</strong> EU Commission-approved clauses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Adequacy Decisions:</strong> Where applicable (UK, Canada, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Supplementary Measures:</strong> Additional technical protections where needed</span>
              </li>
            </ul>
          </section>

          {/* Data Subject Rights */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">8. Data Subject Rights Assistance</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We assist you in fulfilling data subject requests including:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Access requests (right to obtain copies of personal data)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Rectification requests (right to correct inaccurate data)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Erasure requests (right to be forgotten)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Data portability requests</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Restriction and objection requests</span>
              </li>
            </ul>
          </section>

          {/* Breach Notification */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">9. Data Breach Notification</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              In the event of a Personal Data breach, we will:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Notify you without undue delay, and within 48 hours of becoming aware</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Provide details of the breach, affected data, and likely consequences</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Describe measures taken or proposed to address the breach</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Cooperate with you in notifying authorities and data subjects</span>
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. Contact Information</h2>
            <p className="text-gray-300 mb-4">
              For questions about this DPA or to execute a customized DPA for enterprise customers:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-1">Data Protection Officer</h4>
                <p className="text-sm text-gray-400">
                  <a href="mailto:dpo@applyforus.com" className="text-neonYellow hover:underline">
                    dpo@applyforus.com
                  </a>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-1">Legal Department</h4>
                <p className="text-sm text-gray-400">
                  <a href="mailto:legal@applyforus.com" className="text-neonYellow hover:underline">
                    legal@applyforus.com
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/security" className="text-neonYellow hover:underline">Security</Link>
            <Link href="/contact" className="text-neonYellow hover:underline">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function DefinitionItem({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-neonYellow mb-1">{term}</h4>
      <p className="text-sm text-gray-400">{definition}</p>
    </div>
  );
}

function SecurityCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
