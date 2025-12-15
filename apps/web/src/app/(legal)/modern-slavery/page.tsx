'use client';

import Link from 'next/link';
import { Bot, Shield, Users, FileText, CheckCircle2, Building2, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS MODERN SLAVERY ACT STATEMENT

   Version: 1.0.0
   Last Updated: December 2024
   Financial Year: 2024

   Required for UK Modern Slavery Act 2015
   compliance for organizations with turnover
   exceeding GBP 36 million.
   ============================================ */

export default function ModernSlaveryPage() {
  const currentYear = new Date().getFullYear();

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
              Modern Slavery Statement
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
            Modern Slavery Act <span className="text-neonYellow">Statement</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our commitment to preventing modern slavery and human trafficking in our business and supply chains.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Financial Year: {currentYear}</span>
            <span>|</span>
            <span>Published: December {currentYear}</span>
          </div>
        </div>

        {/* Statement Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-neonYellow" />
              Introduction
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This statement is made pursuant to section 54 of the UK Modern Slavery Act 2015 and sets out the steps that ApplyForUs Inc. and its subsidiaries (collectively, "ApplyForUs", "we", "our", or "us") have taken and continue to take to ensure that modern slavery and human trafficking are not taking place within our business or supply chain.
            </p>
            <p className="text-gray-300 leading-relaxed">
              ApplyForUs is committed to conducting business ethically and with integrity. We have zero tolerance for modern slavery and human trafficking and are committed to acting ethically in all our business dealings and relationships.
            </p>
          </section>

          {/* Our Business */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Globe className="w-6 h-6 text-electricGreen" />
              Our Business
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              ApplyForUs is a global technology company providing AI-powered job application automation services. We operate in over 150 countries, helping job seekers find employment opportunities and streamline their application process.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Our core business is software development and delivery of cloud-based services. We employ a diverse, global workforce and engage with third-party service providers for cloud hosting, payment processing, and customer support.
            </p>
          </section>

          {/* Our Supply Chain */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-neonYellow" />
              Our Supply Chain
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our supply chain primarily consists of:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Technology providers:</strong> Cloud infrastructure, AI/ML platforms, and software tools</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Payment processors:</strong> Stripe, Paystack, and Flutterwave for global transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Professional services:</strong> Legal, accounting, and consulting firms</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span><strong>Office supplies and equipment:</strong> IT hardware and office consumables</span>
              </li>
            </ul>
          </section>

          {/* Our Policies */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-electricGreen" />
              Our Policies
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We have implemented the following policies relevant to preventing modern slavery:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <PolicyCard
                title="Code of Conduct"
                description="Sets expectations for ethical behavior from all employees and contractors."
              />
              <PolicyCard
                title="Supplier Code of Conduct"
                description="Requires suppliers to commit to ethical practices and human rights standards."
              />
              <PolicyCard
                title="Whistleblowing Policy"
                description="Enables confidential reporting of concerns without fear of retaliation."
              />
              <PolicyCard
                title="Anti-Slavery Policy"
                description="Specific policy addressing modern slavery risks and prevention measures."
              />
            </div>
          </section>

          {/* Due Diligence */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-neonYellow" />
              Due Diligence Processes
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We undertake the following due diligence activities:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Conducting risk assessments of our supply chain</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Including anti-slavery requirements in supplier contracts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Reviewing supplier compliance certificates and audits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Investigating any reports or allegations of modern slavery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-neonYellow flex-shrink-0 mt-0.5" />
                <span>Regular employee training on identifying and reporting concerns</span>
              </li>
            </ul>
          </section>

          {/* Risk Assessment */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Risk Assessment</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We have assessed the areas of highest risk within our business and supply chain:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-neonYellow">Area</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Risk Level</th>
                    <th className="text-left py-3 px-4 text-neonYellow">Mitigation</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Cloud Hosting</td>
                    <td className="py-3 px-4"><span className="text-green-400">Low</span></td>
                    <td className="py-3 px-4">Major providers with strong compliance</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Payment Processing</td>
                    <td className="py-3 px-4"><span className="text-green-400">Low</span></td>
                    <td className="py-3 px-4">PCI-DSS compliant providers</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Customer Support</td>
                    <td className="py-3 px-4"><span className="text-yellow-400">Medium</span></td>
                    <td className="py-3 px-4">Direct employment or vetted partners</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">IT Hardware</td>
                    <td className="py-3 px-4"><span className="text-yellow-400">Medium</span></td>
                    <td className="py-3 px-4">Supplier audits and certifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Training */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Training</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We provide training to our employees to ensure they understand:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>What modern slavery and human trafficking are</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>The risks of modern slavery in our industry</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>How to identify and report concerns</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Our whistleblowing procedures</span>
              </li>
            </ul>
          </section>

          {/* Approval */}
          <section className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Statement Approval</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              This statement has been approved by the Board of Directors of ApplyForUs Inc. and constitutes our modern slavery and human trafficking statement for the financial year ending December 31, {currentYear}.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-white font-semibold">Signed on behalf of ApplyForUs Inc.</p>
              <p className="text-gray-400 text-sm mt-2">Chief Executive Officer</p>
              <p className="text-gray-500 text-sm">Date: December {currentYear}</p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/contact" className="text-neonYellow hover:underline">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function PolicyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
