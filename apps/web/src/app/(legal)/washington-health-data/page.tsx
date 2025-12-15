'use client';

import Link from 'next/link';
import { Bot, Heart, Shield, FileText, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS WASHINGTON CONSUMER HEALTH DATA
   PRIVACY POLICY

   Version: 1.0.0
   Last Updated: December 2024

   Compliance with Washington My Health My Data Act
   (Chapter 19.373 RCW)

   Effective Date: March 31, 2024
   ============================================ */

export default function WashingtonHealthDataPage() {
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
            <Badge className="bg-electricGreen/10 text-electricGreen border-electricGreen/30">
              WA Health Data Privacy
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-electricGreen/10 text-electricGreen mb-6">
            <Heart className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Washington Consumer Health Data <span className="text-electricGreen">Privacy Policy</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            How we protect consumer health data in compliance with Washington State law.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Version 1.0.0</span>
            <span>|</span>
            <span>Effective: March 31, 2024</span>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-electricGreen/10 border border-electricGreen/30 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-bold text-electricGreen mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Important Notice for Washington Residents
          </h2>
          <p className="text-gray-300">
            This notice is provided in accordance with the Washington My Health My Data Act (Chapter 19.373 RCW). It applies to Washington State residents and describes how ApplyForUs collects, uses, shares, and protects consumer health data.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Definition */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">1. What Is Consumer Health Data?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Under Washington law, "consumer health data" means personal information that is linked or reasonably linkable to a consumer and that identifies the consumer's past, present, or future physical or mental health status. This includes, but is not limited to:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Health conditions, treatment, diseases, or diagnosis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Social, psychological, behavioral, and medical interventions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Health-related surgeries or procedures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Use or purchase of prescribed medications</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Bodily functions, vital signs, symptoms, or measurements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Information that identifies a consumer seeking health care services</span>
              </li>
            </ul>
          </section>

          {/* Our Practices */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">2. Our Health Data Practices</h2>
            <div className="bg-neonYellow/10 border border-neonYellow/30 rounded-xl p-4 mb-6">
              <p className="text-gray-300 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>ApplyForUs does not intentionally collect consumer health data.</strong> Our service is focused on job applications and employment assistance, not health-related services.</span>
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              However, we recognize that in limited circumstances, consumer health data might be incidentally collected through:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Resume uploads:</strong> If you include health-related information in your resume</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Job preference settings:</strong> If you indicate preferences for health-related industries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Customer support:</strong> If you voluntarily share health information in support communications</span>
              </li>
            </ul>
          </section>

          {/* Collection Categories */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">3. Categories of Health Data We May Process</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-neonYellow">Category</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Collected?</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Health conditions/diagnoses</td>
                    <td className="py-3 px-4"><span className="text-gray-500">Only if user-provided</span></td>
                    <td className="py-3 px-4">Job matching (if relevant)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Medications/prescriptions</td>
                    <td className="py-3 px-4"><span className="text-red-400">No</span></td>
                    <td className="py-3 px-4">N/A</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Biometric data</td>
                    <td className="py-3 px-4"><span className="text-red-400">No</span></td>
                    <td className="py-3 px-4">N/A</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Genetic data</td>
                    <td className="py-3 px-4"><span className="text-red-400">No</span></td>
                    <td className="py-3 px-4">N/A</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Healthcare provider info</td>
                    <td className="py-3 px-4"><span className="text-gray-500">Only if user-provided</span></td>
                    <td className="py-3 px-4">Resume/work history</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights Under Washington Law</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              As a Washington resident, you have the following rights regarding consumer health data:
            </p>
            <div className="space-y-4">
              <RightCard
                title="Right to Know"
                description="You have the right to confirm whether we are collecting, sharing, or selling consumer health data concerning you and to access such data."
              />
              <RightCard
                title="Right to Delete"
                description="You have the right to request deletion of any consumer health data concerning you that we have collected."
              />
              <RightCard
                title="Right to Withdraw Consent"
                description="If you have provided consent for the collection or sharing of your consumer health data, you may withdraw that consent at any time."
              />
              <RightCard
                title="Right to Appeal"
                description="If we deny your request, you have the right to appeal our decision."
              />
              <RightCard
                title="Right to Non-Discrimination"
                description="We will not discriminate against you for exercising any of your rights under this policy."
              />
            </div>
          </section>

          {/* How to Exercise Rights */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">5. How to Exercise Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To exercise your rights under Washington law, you may:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-electricGreen" />
                  <span className="font-semibold text-white">Email Request</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Send your request to: <a href="mailto:privacy@applyforus.com" className="text-neonYellow hover:underline">privacy@applyforus.com</a>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-electricGreen" />
                  <span className="font-semibold text-white">Account Settings</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Log in to your account and navigate to Settings {">"} Privacy {">"} Data Rights to submit a request.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-neonYellow/10 rounded-xl border border-neonYellow/30">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Response Time:</strong> We will respond to your request within 45 days as required by law. If we need additional time, we will notify you.
              </p>
            </div>
          </section>

          {/* Consent */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">6. Consent</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Before collecting or sharing any consumer health data:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>We will obtain your consent for any collection beyond what is strictly necessary for our core services</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>We will obtain your consent before sharing consumer health data with third parties for purposes beyond service delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>We will never sell your consumer health data</span>
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect any consumer health data we process, including:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>256-bit AES encryption for data at rest and in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Access controls limiting who can view sensitive data</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Regular security audits and penetration testing</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Employee training on data protection</span>
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-electricGreen/10 border border-electricGreen/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For questions about this policy or to exercise your rights:
            </p>
            <div className="bg-softBlack rounded-xl p-6 border border-white/10">
              <p className="text-gray-400">
                <strong className="text-white">ApplyForUs Privacy Team</strong><br />
                Email: privacy@applyforus.com<br />
                Subject Line: Washington Health Data Inquiry<br /><br />
                Mailing Address:<br />
                ApplyForUs Inc.<br />
                Attn: Privacy Team<br />
                [Address]
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            This policy was last updated in December 2024. We may update this policy periodically.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/do-not-sell" className="text-neonYellow hover:underline">Do Not Sell My Info</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function RightCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-electricGreen" />
        {title}
      </h4>
      <p className="text-sm text-gray-400 ml-6">{description}</p>
    </div>
  );
}
