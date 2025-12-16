'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Crown, Zap, Star, Rocket, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  SubscriptionTierConfig,
  formatPrice,
  getYearlySavings,
} from '@/lib/constants/subscription-tiers';

interface PricingTableProps {
  currentTier?: SubscriptionTier;
  onSelectPlan?: (tier: SubscriptionTier, billingPeriod: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
  className?: string;
}

const tierIcons: Record<SubscriptionTier, React.ElementType> = {
  [SubscriptionTier.FREEMIUM]: Star,
  [SubscriptionTier.STARTER]: Zap,
  [SubscriptionTier.BASIC]: Rocket,
  [SubscriptionTier.PROFESSIONAL]: Sparkles,
  [SubscriptionTier.ADVANCED_CAREER]: Crown,
  [SubscriptionTier.EXECUTIVE_ELITE]: Building2,
};

const tierColors: Record<SubscriptionTier, { bg: string; border: string; text: string; glow: string }> = {
  [SubscriptionTier.FREEMIUM]: {
    bg: 'bg-gray-50 dark:bg-gray-900',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    glow: '',
  },
  [SubscriptionTier.STARTER]: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    glow: '',
  },
  [SubscriptionTier.BASIC]: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    glow: '',
  },
  [SubscriptionTier.PROFESSIONAL]: {
    bg: 'bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-600 dark:text-yellow-400',
    glow: 'shadow-lg shadow-yellow-500/20',
  },
  [SubscriptionTier.ADVANCED_CAREER]: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    glow: '',
  },
  [SubscriptionTier.EXECUTIVE_ELITE]: {
    bg: 'bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-900 dark:to-black',
    border: 'border-gold-400 dark:border-amber-500',
    text: 'text-amber-500 dark:text-amber-400',
    glow: 'shadow-xl shadow-amber-500/10',
  },
};

export function PricingTable({
  currentTier = SubscriptionTier.FREEMIUM,
  onSelectPlan,
  isLoading = false,
  className,
}: PricingTableProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (onSelectPlan && tier !== currentTier) {
      onSelectPlan(tier, billingPeriod);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all',
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2',
              billingPeriod === 'yearly'
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            Yearly
            <Badge variant="success" className="text-xs">Save up to 17%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            billingPeriod={billingPeriod}
            isCurrentPlan={currentTier === tier.id}
            onSelect={() => handleSelectPlan(tier.id)}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Feature Comparison Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          All plans include secure data handling and 24/7 platform availability.{' '}
          <a href="/subscription-terms" className="text-primary-600 hover:underline">
            View full feature comparison
          </a>
        </p>
      </div>
    </div>
  );
}

interface PricingCardProps {
  tier: SubscriptionTierConfig;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

function PricingCard({ tier, billingPeriod, isCurrentPlan, onSelect, isLoading }: PricingCardProps) {
  const Icon = tierIcons[tier.id];
  const colors = tierColors[tier.id];
  const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  const yearlySavings = getYearlySavings(tier);
  const isExecutiveElite = tier.id === SubscriptionTier.EXECUTIVE_ELITE;

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]',
        colors.bg,
        colors.border,
        colors.glow,
        tier.popular && 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-gray-900'
      )}
    >
      {/* Popular Badge */}
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-yellow-500 text-black font-bold px-4 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('p-2 rounded-lg', colors.bg, colors.text)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={cn(
            'text-xl font-bold',
            isExecutiveElite ? 'text-white' : 'text-gray-900 dark:text-white'
          )}>
            {tier.name}
          </h3>
          <p className={cn(
            'text-sm',
            isExecutiveElite ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
          )}>
            {tier.description}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className={cn(
            'text-4xl font-bold',
            isExecutiveElite ? 'text-amber-400' : colors.text
          )}>
            {formatPrice(price)}
          </span>
          {price > 0 && (
            <span className={cn(
              'text-sm',
              isExecutiveElite ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
            )}>
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </span>
          )}
        </div>
        {billingPeriod === 'yearly' && yearlySavings > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Save {yearlySavings}% with yearly billing
          </p>
        )}
        {billingPeriod === 'yearly' && tier.monthlyPrice > 0 && (
          <p className={cn(
            'text-xs mt-1',
            isExecutiveElite ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
          )}>
            ${(tier.yearlyPrice / 12).toFixed(2)}/month billed annually
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {tier.highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.text)} />
            <span className={cn(
              'text-sm',
              isExecutiveElite ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'
            )}>
              {highlight}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        onClick={onSelect}
        disabled={isCurrentPlan || isLoading}
        className={cn(
          'w-full',
          tier.popular && 'bg-yellow-500 hover:bg-yellow-600 text-black',
          isExecutiveElite && 'bg-amber-500 hover:bg-amber-600 text-black'
        )}
        variant={isCurrentPlan ? 'outline' : tier.popular || isExecutiveElite ? 'default' : 'outline'}
      >
        {isLoading ? (
          'Loading...'
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : tier.monthlyPrice === 0 ? (
          'Get Started Free'
        ) : (
          `Upgrade to ${tier.name}`
        )}
      </Button>
    </div>
  );
}

// Compact version for dashboard/settings
interface CompactPricingProps {
  currentTier?: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  className?: string;
}

export function CompactPricing({ currentTier = SubscriptionTier.FREEMIUM, onUpgrade, className }: CompactPricingProps) {
  const currentTierConfig = SUBSCRIPTION_TIERS.find((t) => t.id === currentTier);
  const currentIndex = SUBSCRIPTION_TIERS.findIndex((t) => t.id === currentTier);
  const nextTier = currentIndex < SUBSCRIPTION_TIERS.length - 1 ? SUBSCRIPTION_TIERS[currentIndex + 1] : null;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Plan */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {currentTierConfig?.name || 'Free'} Plan
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentTierConfig?.description}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(currentTierConfig?.monthlyPrice || 0)}
            </div>
            <div className="text-sm text-gray-500">/month</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentTierConfig?.highlights.slice(0, 3).map((highlight, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {highlight}
            </Badge>
          ))}
        </div>
      </div>

      {/* Upgrade Prompt */}
      {nextTier && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Upgrade to {nextTier.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get {nextTier.features.jobApplicationsPerMonth === 'Unlimited' ? 'unlimited' : nextTier.features.jobApplicationsPerMonth} applications/month
              </p>
            </div>
            <Button
              onClick={() => onUpgrade?.(nextTier.id)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Upgrade for ${nextTier.monthlyPrice}/mo
            </Button>
          </div>
        </div>
      )}

      {/* View All Plans */}
      <a
        href="/pricing"
        className="block text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        View all plans and features
      </a>
    </div>
  );
}

export default PricingTable;
