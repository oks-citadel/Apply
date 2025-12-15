'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ArrowLeft, Shield, FileText, Cookie, Eye, Scale, Users, Globe, CreditCard, Copyright, AlertTriangle, Heart } from 'lucide-react';

/* ============================================
   APPLYFORUS LEGAL PAGES LAYOUT

   Futuristic dark theme with comprehensive
   navigation to all legal and policy pages.
   ============================================ */

const legalPages = [
  { href: '/privacy', label: 'Privacy Policy', icon: Shield, category: 'Privacy' },
  { href: '/terms', label: 'Terms of Service', icon: FileText, category: 'Legal' },
  { href: '/cookies', label: 'Cookie Policy', icon: Cookie, category: 'Privacy' },
  { href: '/dpa', label: 'Data Processing Agreement', icon: Scale, category: 'Privacy' },
  { href: '/ccpa-notice', label: 'CCPA Notice', icon: Eye, category: 'Privacy' },
  { href: '/do-not-sell', label: 'Do Not Sell My Info', icon: Eye, category: 'Privacy' },
  { href: '/washington-health-data', label: 'WA Health Data', icon: Heart, category: 'Privacy' },
  { href: '/ai-transparency', label: 'AI Transparency', icon: Bot, category: 'AI & Safety' },
  { href: '/safety', label: 'Safety Policy', icon: AlertTriangle, category: 'AI & Safety' },
  { href: '/subscription-terms', label: 'Subscription Terms', icon: CreditCard, category: 'Billing' },
  { href: '/ip-policy', label: 'IP & DMCA Policy', icon: Copyright, category: 'Legal' },
  { href: '/accessibility', label: 'Accessibility', icon: Users, category: 'Legal' },
  { href: '/modern-slavery', label: 'Modern Slavery', icon: Globe, category: 'Compliance' },
];

const categories = ['Privacy', 'Legal', 'AI & Safety', 'Billing', 'Compliance'];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-deepBlack">
      {/* Navigation Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-softBlack border-r border-white/10 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neonYellow to-electricGreen flex items-center justify-center">
                <Bot className="w-6 h-6 text-deepBlack" />
              </div>
              <span className="text-xl font-bold text-white">
                Apply<span className="text-neonYellow">ForUs</span>
              </span>
            </Link>
          </div>

          {/* Back to Home */}
          <div className="px-4 mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-neonYellow hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="mt-2 space-y-1">
                  {legalPages
                    .filter((page) => page.category === category)
                    .map((page) => {
                      const isActive = pathname === page.href;
                      const Icon = page.icon;
                      return (
                        <Link
                          key={page.href}
                          href={page.href}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? 'bg-neonYellow/10 text-neonYellow border border-neonYellow/30'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{page.label}</span>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>

          {/* Contact Info */}
          <div className="px-4 pt-6 border-t border-white/10 mt-4">
            <div className="px-3 py-4 bg-deepBlack/50 rounded-xl">
              <h4 className="text-sm font-semibold text-white mb-2">Need Help?</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p>Legal: <a href="mailto:legal@applyforus.com" className="text-neonYellow hover:underline">legal@applyforus.com</a></p>
                <p>Privacy: <a href="mailto:privacy@applyforus.com" className="text-neonYellow hover:underline">privacy@applyforus.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-softBlack/95 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonYellow to-electricGreen flex items-center justify-center">
                <Bot className="w-5 h-5 text-deepBlack" />
              </div>
              <span className="text-lg font-bold text-white">
                Apply<span className="text-neonYellow">ForUs</span>
              </span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-neonYellow transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="border-t border-white/5 overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {legalPages.map((page) => {
              const isActive = pathname === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-neonYellow/20 text-neonYellow'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {page.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="min-h-screen">
          {children}
        </div>

        {/* Footer */}
        <footer className="bg-softBlack border-t border-white/10">
          <div className="container mx-auto px-4 py-12 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
              {/* Legal Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Privacy & Data</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/privacy" className="hover:text-neonYellow transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-neonYellow transition-colors">Cookie Policy</Link></li>
                  <li><Link href="/dpa" className="hover:text-neonYellow transition-colors">Data Processing</Link></li>
                  <li><Link href="/ccpa-notice" className="hover:text-neonYellow transition-colors">CCPA Notice</Link></li>
                  <li><Link href="/do-not-sell" className="hover:text-neonYellow transition-colors">Do Not Sell</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Terms & Policies</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/terms" className="hover:text-neonYellow transition-colors">Terms of Service</Link></li>
                  <li><Link href="/subscription-terms" className="hover:text-neonYellow transition-colors">Subscription Terms</Link></li>
                  <li><Link href="/ip-policy" className="hover:text-neonYellow transition-colors">IP & DMCA Policy</Link></li>
                  <li><Link href="/accessibility" className="hover:text-neonYellow transition-colors">Accessibility</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">AI & Safety</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/ai-transparency" className="hover:text-neonYellow transition-colors">AI Transparency</Link></li>
                  <li><Link href="/safety" className="hover:text-neonYellow transition-colors">Safety Policy</Link></li>
                  <li><Link href="/washington-health-data" className="hover:text-neonYellow transition-colors">WA Health Data</Link></li>
                  <li><Link href="/modern-slavery" className="hover:text-neonYellow transition-colors">Modern Slavery</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>Legal: <a href="mailto:legal@applyforus.com" className="text-neonYellow hover:underline">legal@applyforus.com</a></li>
                  <li>Privacy: <a href="mailto:privacy@applyforus.com" className="text-neonYellow hover:underline">privacy@applyforus.com</a></li>
                  <li>DPO: <a href="mailto:dpo@applyforus.com" className="text-neonYellow hover:underline">dpo@applyforus.com</a></li>
                  <li>DMCA: <a href="mailto:dmca@applyforus.com" className="text-neonYellow hover:underline">dmca@applyforus.com</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Compliance</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-electricGreen rounded-full"></span>
                    GDPR Compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-electricGreen rounded-full"></span>
                    CCPA/CPRA Compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-electricGreen rounded-full"></span>
                    PIPEDA Compliant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-electricGreen rounded-full"></span>
                    SOC 2 Type II
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} ApplyForUs Inc. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link href="/privacy" className="hover:text-neonYellow transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-neonYellow transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-neonYellow transition-colors">Cookies</Link>
                <Link href="/contact" className="hover:text-neonYellow transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
