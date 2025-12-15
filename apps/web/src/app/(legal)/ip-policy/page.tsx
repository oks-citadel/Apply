'use client';

import Link from 'next/link';
import { Bot, Shield, FileText, CheckCircle2, AlertCircle, Copyright, Scale, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS INTELLECTUAL PROPERTY & DMCA POLICY

   Version: 1.0.0
   Last Updated: December 2024

   This policy covers:
   - Copyright and trademark rights
   - DMCA takedown procedures
   - Counter-notification process
   - User-generated content licensing
   ============================================ */

export default function IPPolicyPage() {
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
              IP & DMCA Policy
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-6">
            <Copyright className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Intellectual Property & <span className="text-neonYellow">DMCA Policy</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our policies regarding intellectual property rights, copyright claims, and DMCA procedures.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last Updated: December 2024
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-8">
          {/* Our IP */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-neonYellow" />
              1. ApplyForUs Intellectual Property
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              All content, features, and functionality of the ApplyForUs platform are owned by ApplyForUs Inc. and are protected by international copyright, trademark, patent, and other intellectual property laws.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-neonYellow mb-2">Trademarks</h4>
                <p className="text-sm text-gray-400">
                  "ApplyForUs", the ApplyForUs logo, and all related names, logos, product and service names, designs, and slogans are trademarks of ApplyForUs Inc. You may not use these marks without our prior written permission.
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-neonYellow mb-2">Software & Technology</h4>
                <p className="text-sm text-gray-400">
                  Our AI algorithms, application automation technology, and platform software are proprietary. Reverse engineering, decompiling, or attempting to extract source code is prohibited.
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
                <h4 className="font-semibold text-neonYellow mb-2">Content</h4>
                <p className="text-sm text-gray-400">
                  All text, graphics, user interfaces, visual interfaces, photographs, trademarks, logos, sounds, music, artwork, and computer code on the platform are owned or licensed by us.
                </p>
              </div>
            </div>
          </section>

          {/* Your Content */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-electricGreen" />
              2. Your Content & License Grant
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You retain ownership of content you upload to ApplyForUs (resumes, cover letters, profile information). However, by using our services, you grant us certain licenses:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Service License:</strong> A non-exclusive, worldwide license to use, store, process, and display your content to provide our services.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>AI Training:</strong> An anonymized, aggregated license to use patterns from your content to improve our AI models (you can opt out in settings).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span><strong>Employer Sharing:</strong> License to share your application materials with employers you apply to.</span>
              </li>
            </ul>
            <div className="mt-4 bg-electricGreen/10 border border-electricGreen/30 rounded-xl p-4">
              <h4 className="font-semibold text-electricGreen mb-2">AI-Generated Content</h4>
              <p className="text-sm text-gray-400">
                Content generated by our AI (enhanced resumes, cover letters) is provided to you with a perpetual, royalty-free license to use for any lawful purpose. You are responsible for reviewing and verifying accuracy.
              </p>
            </div>
          </section>

          {/* DMCA Policy */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Scale className="w-6 h-6 text-neonYellow" />
              3. DMCA Copyright Policy
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              ApplyForUs respects the intellectual property rights of others and expects users to do the same. We comply with the Digital Millennium Copyright Act (DMCA) and will respond to notices of alleged copyright infringement.
            </p>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Filing a DMCA Notice</h4>
                <p className="text-gray-400 text-sm mb-3">
                  If you believe your copyrighted work has been copied in a way that constitutes infringement, please provide our DMCA Agent with:
                </p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>A physical or electronic signature of the copyright owner or authorized agent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>Identification of the copyrighted work claimed to be infringed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>Identification of the allegedly infringing material and its location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>Your contact information (address, phone number, email)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>A statement that you have a good faith belief the use is not authorized</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>A statement, under penalty of perjury, that the information is accurate</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Counter-Notification */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-electricGreen" />
              4. Counter-Notification
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you believe your content was removed by mistake or misidentification, you may file a counter-notification containing:
            </p>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Your physical or electronic signature</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Identification of the material removed and its location before removal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Your name, address, phone number, and consent to jurisdiction</span>
              </li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              Upon receiving a valid counter-notification, we will provide it to the original complainant. If they do not file a court action within 10-14 business days, we may restore the removed content.
            </p>
          </section>

          {/* Repeat Infringers */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">5. Repeat Infringers</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We maintain a policy of terminating accounts of users who are repeat infringers of intellectual property rights. Users who receive multiple valid DMCA notices may have their accounts suspended or permanently terminated.
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h4 className="font-semibold text-red-400 mb-2">Warning</h4>
              <p className="text-sm text-gray-400">
                Filing false DMCA claims or counter-notifications may result in legal liability. Only submit claims if you genuinely believe infringement has occurred.
              </p>
            </div>
          </section>

          {/* Third-Party Content */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Content</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our platform may display third-party content including:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Job Postings:</strong> Sourced from employers and job boards - copyright belongs to the original publishers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Company Logos:</strong> Used for identification purposes under fair use</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Integration Partners:</strong> Trademarks of LinkedIn, Indeed, etc. belong to their respective owners</span>
              </li>
            </ul>
          </section>

          {/* Permitted Uses */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">7. Permitted Uses</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You may use ApplyForUs content for:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Your personal job search activities</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Sharing your profile/resume with potential employers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Referencing our services in reviews or testimonials</span>
              </li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              For press inquiries or partnership requests involving our intellectual property, contact <a href="mailto:press@applyforus.com" className="text-neonYellow hover:underline">press@applyforus.com</a>
            </p>
          </section>

          {/* DMCA Agent Contact */}
          <section className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-neonYellow" />
              DMCA Agent Contact
            </h2>
            <p className="text-gray-300 mb-4">
              Send DMCA notices and counter-notifications to our designated agent:
            </p>
            <div className="p-4 bg-deepBlack/50 rounded-xl">
              <p className="text-white font-semibold mb-2">ApplyForUs DMCA Agent</p>
              <div className="space-y-1 text-sm text-gray-400">
                <p>ApplyForUs Inc.</p>
                <p>Attn: Legal Department - DMCA</p>
                <p>123 Innovation Drive, Suite 500</p>
                <p>San Francisco, CA 94105</p>
                <p className="mt-2">
                  Email: <a href="mailto:dmca@applyforus.com" className="text-neonYellow hover:underline">dmca@applyforus.com</a>
                </p>
                <p>Phone: 1-800-APPLY-US (1-800-277-5987)</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Please note: This contact is for IP/DMCA matters only. For general support, visit our <Link href="/contact" className="text-neonYellow hover:underline">Contact page</Link>.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/safety" className="text-neonYellow hover:underline">Safety Policy</Link>
            <Link href="/contact" className="text-neonYellow hover:underline">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
