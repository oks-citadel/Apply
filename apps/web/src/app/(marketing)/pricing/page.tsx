'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PricingTable } from '@/components/features/billing/PricingTable';
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  formatFeatureValue,
} from '@/lib/constants/subscription-tiers';
import { useCreateCheckoutSession } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();
  const createCheckout = useCreateCheckoutSession();
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectPlan = async (tier: SubscriptionTier, billingPeriod: 'monthly' | 'yearly') => {
    if (tier === SubscriptionTier.FREEMIUM) {
      router.push('/register');
      return;
    }

    try {
      await createCheckout.mutateAsync({
        plan: tier.toLowerCase(),
        interval: billingPeriod === 'monthly' ? 'month' : 'year',
      });
    } catch {
      // If not logged in, redirect to register
      router.push('/register?plan=' + tier.toLowerCase());
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your <span className="text-primary-600">Career Acceleration</span> Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            From getting started to executive-level job search, we have a plan that fits your career ambitions.
            All plans include our AI-powered job matching technology.
          </p>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 px-4">
        <PricingTable
          onSelectPlan={handleSelectPlan}
          isLoading={createCheckout.isPending}
          className="max-w-7xl mx-auto"
        />
      </section>

      {/* Feature Comparison Toggle */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-center gap-2 py-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors"
          >
            {showComparison ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Hide detailed comparison
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                Show detailed feature comparison
              </>
            )}
          </button>

          {showComparison && <FeatureComparisonTable />}
        </div>
      </section>

      {/* Virtual Coins Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Virtual Coins
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Need extra visibility? Purchase virtual coins to boost your profile and applications.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { coins: 100, price: 0.99, bonus: 0 },
              { coins: 500, price: 4.49, bonus: 50 },
              { coins: 1000, price: 7.99, bonus: 150 },
              { coins: 2500, price: 17.99, bonus: 500 },
              { coins: 5000, price: 32.99, bonus: 1250 },
              { coins: 10000, price: 59.99, bonus: 3000 },
            ].map((pkg) => (
              <div
                key={pkg.coins}
                className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pkg.coins.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">coins</div>
                {pkg.bonus > 0 && (
                  <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                    +{pkg.bonus} bonus
                  </Badge>
                )}
                <div className="mt-3 text-lg font-semibold text-primary-600">
                  ${pkg.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Can I switch plans at any time?"
              answer="Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing period."
            />
            <FAQItem
              question="What happens to my unused applications?"
              answer="Unused applications do not roll over to the next month. We recommend choosing a plan that matches your actual job search activity."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Our Freemium plan is free forever with 5 applications per month. You can upgrade anytime to unlock more features and applications."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, Mastercard, American Express), as well as regional payment methods like Paystack and Flutterwave for African markets."
            />
            <FAQItem
              question="Can I cancel my subscription?"
              answer="Yes, you can cancel anytime from your account settings. Your subscription will remain active until the end of your current billing period."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join thousands of professionals who have landed their dream jobs with ApplyForUs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureComparisonTable() {
  const features = [
    { key: 'jobApplicationsPerMonth', label: 'Job Applications / Month' },
    { key: 'aiGeneratedCoverLetters', label: 'AI Cover Letters' },
    { key: 'resumeTemplates', label: 'Resume Templates' },
    { key: 'savedJobs', label: 'Saved Jobs' },
    { key: 'virtualCoinsPerMonth', label: 'Virtual Coins / Month' },
    { key: 'boostVisibilitySlots', label: 'Boost Visibility Slots' },
    { key: 'emailAlerts', label: 'Email Alerts' },
    { key: 'autoApplyEnabled', label: 'Auto-Apply' },
    { key: 'salaryInsights', label: 'Salary Insights' },
    { key: 'companyInsights', label: 'Company Insights' },
    { key: 'interviewPrepAccess', label: 'Interview Prep' },
    { key: 'prioritySupport', label: 'Priority Support' },
    { key: 'advancedAnalytics', label: 'Advanced Analytics' },
    { key: 'customBranding', label: 'Custom Branding' },
    { key: 'apiAccess', label: 'API Access' },
    { key: 'dedicatedAccountManager', label: 'Dedicated Account Manager' },
  ];

  return (
    <div className="overflow-x-auto mt-8">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-4 px-4 font-medium text-gray-600 dark:text-gray-400">
              Feature
            </th>
            {SUBSCRIPTION_TIERS.map((tier) => (
              <th
                key={tier.id}
                className="text-center py-4 px-4 font-semibold text-gray-900 dark:text-white"
              >
                {tier.name}
                {tier.popular && (
                  <Badge className="ml-2 bg-yellow-500 text-black text-xs">Popular</Badge>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr
              key={feature.key}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{feature.label}</td>
              {SUBSCRIPTION_TIERS.map((tier) => {
                const value = tier.features[feature.key as keyof typeof tier.features];
                return (
                  <td key={tier.id} className="text-center py-3 px-4">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatFeatureValue(value)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">Price</td>
            {SUBSCRIPTION_TIERS.map((tier) => (
              <td key={tier.id} className="text-center py-4 px-4">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {tier.monthlyPrice === 0 ? 'Free' : `$${tier.monthlyPrice}`}
                </div>
                {tier.monthlyPrice > 0 && (
                  <div className="text-xs text-gray-500">/month</div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-gray-600 dark:text-gray-400">{answer}</div>
      )}
    </div>
  );
}
