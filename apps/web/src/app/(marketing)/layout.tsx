'use client';

import Link from 'next/link';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/* ============================================
   APPLYFORUS MARKETING PAGES LAYOUT

   Public pages for pricing, features, etc.
   ============================================ */

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Apply<span className="text-primary-600">ForUs</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/#features"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-primary-600 dark:text-primary-400"
              >
                Pricing
              </Link>
              <Link
                href="/#testimonials"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Testimonials
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ApplyForUs
                </span>
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered job application automation to help you land your dream job faster.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/#features" className="hover:text-primary-600 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary-600 transition-colors">Pricing</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-primary-600 transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/subscription-terms" className="hover:text-primary-600 transition-colors">Subscription Terms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="mailto:support@applyforus.com" className="hover:text-primary-600 transition-colors">support@applyforus.com</a></li>
                <li><Link href="/contact" className="hover:text-primary-600 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ApplyForUs Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
