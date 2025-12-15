'use client';

import Link from 'next/link';
import { Bot, CreditCard, CheckCircle2, AlertCircle, RefreshCw, XCircle, Zap, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/* ============================================
   APPLYFORUS EXTENDED SUBSCRIPTION TERMS

   Version: 1.0.0
   Last Updated: December 2024

   Detailed terms governing subscriptions,
   billing, refunds, and tier-specific features.
   ============================================ */

export default function SubscriptionTermsPage() {
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
              Subscription Terms
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neonYellow/10 text-neonYellow mb-6">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Subscription <span className="text-neonYellow">Terms</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Detailed terms and conditions governing your ApplyForUs subscription, billing, and usage.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last Updated: December 2024
          </div>
        </div>

        {/* Subscription Tiers Overview */}
        <div className="bg-softBlack rounded-2xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Crown className="w-6 h-6 text-neonYellow" />
            Subscription Tiers
          </h2>
          <div className="grid gap-4">
            <TierCard
              name="Free"
              price="$0"
              period="forever"
              features={[
                '5 AI-assisted applications per month',
                'Basic resume builder',
                'Limited job search',
                'Email support'
              ]}
              icon={<Star className="w-5 h-5" />}
              color="gray"
            />
            <TierCard
              name="Starter"
              price="$9.99"
              period="per month"
              features={[
                '50 AI-assisted applications per month',
                'AI resume optimization',
                'Cover letter generation',
                'Application tracking',
                'Email support'
              ]}
              icon={<Zap className="w-5 h-5" />}
              color="blue"
            />
            <TierCard
              name="Basic"
              price="$19.99"
              period="per month"
              features={[
                '150 AI-assisted applications per month',
                'All Starter features',
                'Auto-apply automation',
                'Priority job matching',
                'Chat support'
              ]}
              icon={<Zap className="w-5 h-5" />}
              color="green"
            />
            <TierCard
              name="Pro"
              price="$39.99"
              period="per month"
              features={[
                '500 AI-assisted applications per month',
                'All Basic features',
                'Interview preparation AI',
                'Salary negotiation guidance',
                'Priority support'
              ]}
              icon={<Crown className="w-5 h-5" />}
              color="purple"
              popular
            />
            <TierCard
              name="Business"
              price="$79.99"
              period="per month"
              features={[
                '1,500 AI-assisted applications per month',
                'All Pro features',
                'Team collaboration tools',
                'Advanced analytics',
                'Dedicated account manager'
              ]}
              icon={<Crown className="w-5 h-5" />}
              color="orange"
            />
            <TierCard
              name="Enterprise"
              price="Custom"
              period="contact sales"
              features={[
                'Unlimited applications',
                'All Business features',
                'Custom AI training',
                'API access',
                'SLA guarantees',
                'On-premise deployment option'
              ]}
              icon={<Crown className="w-5 h-5" />}
              color="yellow"
            />
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* Billing */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-electricGreen" />
              1. Billing Terms
            </h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">Billing Cycle</h4>
                <p>Subscriptions are billed either monthly or annually, depending on your selection at signup. Annual subscriptions receive a discount equivalent to 2 months free.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Payment Methods</h4>
                <p>We accept major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and in select regions: Paystack, Flutterwave, and bank transfers.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Automatic Renewal</h4>
                <p>Subscriptions automatically renew at the end of each billing period unless cancelled. You will be charged within 24 hours of your renewal date.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Failed Payments</h4>
                <p>If payment fails, we will retry 3 times over 10 days. After all retries fail, your subscription will be downgraded to Free tier. Your data will be preserved for 30 days.</p>
              </div>
            </div>
          </section>

          {/* Virtual Coins */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-neonYellow" />
              2. Virtual Coins
            </h2>
            <p className="text-gray-300 mb-4">
              Virtual Coins are an alternative currency for purchasing additional applications and features:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <CoinPackage coins={100} price={9.99} bonus={0} />
              <CoinPackage coins={250} price={19.99} bonus={25} />
              <CoinPackage coins={500} price={34.99} bonus={75} />
              <CoinPackage coins={1000} price={59.99} bonus={200} />
              <CoinPackage coins={2500} price={129.99} bonus={625} />
              <CoinPackage coins={5000} price={229.99} bonus={1500} />
            </div>
            <div className="bg-deepBlack/50 rounded-xl p-4 border border-white/5">
              <h4 className="font-semibold text-neonYellow mb-2">Virtual Coin Terms</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li>• Coins are non-refundable once purchased</li>
                <li>• Coins expire 12 months after purchase</li>
                <li>• Coins cannot be transferred between accounts</li>
                <li>• Bonus coins are subject to the same terms</li>
                <li>• Exchange rate: 1 Coin = 1 Application</li>
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-400" />
              3. Cancellation
            </h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">How to Cancel</h4>
                <p>You can cancel your subscription at any time from your Account Settings or by contacting support. Cancellation takes effect at the end of your current billing period.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">What Happens After Cancellation</h4>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>You retain access to paid features until your billing period ends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>Your data remains accessible on the Free tier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>Unused Virtual Coins remain valid until expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span>You can resubscribe at any time</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Refunds */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-electricGreen" />
              4. Refund Policy
            </h2>
            <div className="space-y-4 text-gray-300">
              <div className="bg-electricGreen/10 border border-electricGreen/30 rounded-xl p-4">
                <h4 className="font-semibold text-electricGreen mb-2">14-Day Money-Back Guarantee</h4>
                <p className="text-sm">New subscribers can request a full refund within 14 days of their first payment, no questions asked.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Refund Eligibility</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span><strong>Eligible:</strong> First-time subscribers within 14 days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span><strong>Eligible:</strong> Service unavailable for 48+ continuous hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                    <span><strong>Eligible:</strong> Duplicate/erroneous charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Not Eligible:</strong> After 14-day period (except outages)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Not Eligible:</strong> Virtual Coin purchases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Not Eligible:</strong> Accounts terminated for policy violations</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Refund Process</h4>
                <p>Refunds are processed to the original payment method within 5-10 business days. Contact <a href="mailto:billing@applyforus.com" className="text-neonYellow hover:underline">billing@applyforus.com</a> for assistance.</p>
              </div>
            </div>
          </section>

          {/* Price Changes */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-neonYellow" />
              5. Price Changes
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>
                We may change subscription prices with 30 days notice. For annual subscribers, price changes take effect at your next renewal date. You will be notified via email of any price changes.
              </p>
              <div className="bg-neonYellow/10 border border-neonYellow/30 rounded-xl p-4">
                <h4 className="font-semibold text-neonYellow mb-2">Price Lock Guarantee</h4>
                <p className="text-sm">Annual subscribers are guaranteed their rate for the full subscription year, regardless of any price increases during that period.</p>
              </div>
            </div>
          </section>

          {/* Fair Use */}
          <section className="bg-softBlack rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">6. Fair Use Policy</h2>
            <p className="text-gray-300 mb-4">
              To ensure service quality for all users, the following fair use limits apply:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Applications must be for genuine job opportunities you're qualified for</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Maximum 100 applications per day (even for unlimited plans)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Accounts are for individual use only (except Business/Enterprise)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-electricGreen flex-shrink-0 mt-0.5" />
                <span>Automated/bot access is prohibited (use official API for integrations)</span>
              </li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              Violation of fair use policy may result in account suspension or termination. See our <Link href="/safety" className="text-neonYellow hover:underline">Safety Policy</Link> for details.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-neonYellow/10 border border-neonYellow/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
            <p className="text-gray-300 mb-4">
              For billing questions or subscription assistance:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-1">Billing Support</h4>
                <p className="text-sm text-gray-400">
                  <a href="mailto:billing@applyforus.com" className="text-neonYellow hover:underline">
                    billing@applyforus.com
                  </a>
                </p>
              </div>
              <div className="p-4 bg-deepBlack/50 rounded-xl">
                <h4 className="font-semibold text-white mb-1">Enterprise Sales</h4>
                <p className="text-sm text-gray-400">
                  <a href="mailto:enterprise@applyforus.com" className="text-neonYellow hover:underline">
                    enterprise@applyforus.com
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/terms" className="text-neonYellow hover:underline">Terms of Service</Link>
            <Link href="/privacy" className="text-neonYellow hover:underline">Privacy Policy</Link>
            <Link href="/pricing" className="text-neonYellow hover:underline">Pricing</Link>
            <Link href="/contact" className="text-neonYellow hover:underline">Contact Us</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function TierCard({
  name,
  price,
  period,
  features,
  icon,
  color,
  popular = false
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'border-gray-500/30 bg-gray-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    green: 'border-electricGreen/30 bg-electricGreen/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    yellow: 'border-neonYellow/30 bg-neonYellow/5',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]} ${popular ? 'ring-2 ring-neonYellow' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-neonYellow">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{name}</h3>
              {popular && (
                <Badge className="bg-neonYellow/20 text-neonYellow text-xs">Most Popular</Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">
              <span className="text-xl font-bold text-white">{price}</span> {period}
            </p>
          </div>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-400">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-electricGreen flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoinPackage({ coins, price, bonus }: { coins: number; price: number; bonus: number }) {
  return (
    <div className="p-4 bg-deepBlack/50 rounded-xl border border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-neonYellow">{coins.toLocaleString()}</span>
          <span className="text-gray-400 text-sm ml-1">coins</span>
          {bonus > 0 && (
            <span className="text-electricGreen text-sm ml-2">+{bonus} bonus</span>
          )}
        </div>
        <span className="text-white font-bold">${price.toFixed(2)}</span>
      </div>
    </div>
  );
}
