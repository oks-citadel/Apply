# SLA System Frontend Integration Examples

This document provides React/TypeScript examples for integrating the SLA system into your frontend application.

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [API Client](#api-client)
3. [React Hooks](#react-hooks)
4. [Components](#components)
5. [Usage Examples](#usage-examples)

---

## Type Definitions

First, create TypeScript interfaces for type safety:

```typescript
// types/sla.types.ts

export enum SLATier {
  PROFESSIONAL = 'professional',
  PREMIUM = 'premium',
  ELITE = 'elite',
}

export enum SLAStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  VIOLATED = 'violated',
  CANCELLED = 'cancelled',
}

export interface SLATierConfig {
  tier: SLATier;
  name: string;
  price: number;
  guaranteedInterviews: number;
  deadlineDays: number;
  features: string[];
}

export interface SLAContract {
  id: string;
  userId: string;
  tier: SLATier;
  status: SLAStatus;
  guaranteedInterviews: number;
  deadlineDays: number;
  contractPrice: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  totalApplicationsSent: number;
  totalInterviewsScheduled: number;
  progressPercentage: number;
  responseRate: number;
  interviewRate: number;
  isGuaranteeMet: boolean;
  isActive: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  status: 'eligible' | 'ineligible' | 'pending_review';
  checkResult: {
    passedFields: string[];
    failedFields: string[];
    profileCompleteness: number;
    resumeScore: number;
    workExperienceMonths: number;
    hasApprovedResume: boolean;
  };
  recommendations: string[];
}

export interface DashboardData {
  contract: SLAContract;
  recentProgress: ProgressEvent[];
  analytics: SLAAnalytics;
  milestones: Milestone[];
  recommendations: string[];
}

export interface SLAAnalytics {
  daysActive: number;
  daysRemaining: number;
  applicationsPerDay: number;
  responseRate: number;
  interviewRate: number;
  onTrackToMeetGuarantee: boolean;
  projectedInterviews: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
}

export interface ProgressEvent {
  id: string;
  eventType: string;
  jobTitle?: string;
  companyName?: string;
  createdAt: string;
  isVerified: boolean;
}
```

---

## API Client

Create a client for SLA API calls:

```typescript
// lib/sla-client.ts

import axios, { AxiosInstance } from 'axios';

class SLAClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'http://localhost:8006') {
    this.client = axios.create({
      baseURL: `${baseURL}/api/v1/sla`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Check eligibility
  async checkEligibility(userId: string, tier: SLATier): Promise<EligibilityResult> {
    const { data } = await this.client.get(`/eligibility/${userId}`, {
      params: { tier },
    });
    return data;
  }

  // Create contract
  async createContract(
    userId: string,
    tier: SLATier,
    paymentIntentId: string
  ): Promise<{ success: boolean; contract: SLAContract; message: string }> {
    const { data } = await this.client.post('/contracts', {
      userId,
      tier,
      stripePaymentIntentId: paymentIntentId,
    });
    return data;
  }

  // Get status
  async getStatus(userId: string): Promise<SLAContract> {
    const { data } = await this.client.get(`/status/${userId}`);
    return data;
  }

  // Get dashboard
  async getDashboard(userId: string): Promise<DashboardData> {
    const { data } = await this.client.get(`/dashboard/${userId}`);
    return data;
  }

  // Track application
  async trackApplication(params: {
    userId: string;
    applicationId: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    confidenceScore: number;
  }): Promise<any> {
    const { data } = await this.client.post('/track-application', params);
    return data;
  }

  // Track interview
  async trackInterview(params: {
    userId: string;
    applicationId: string;
    interviewScheduledAt: string;
    interviewType: string;
  }): Promise<any> {
    const { data } = await this.client.post('/track-interview', params);
    return data;
  }

  // Extend contract
  async extendContract(
    userId: string,
    extensionDays: number,
    reason?: string
  ): Promise<SLAContract> {
    const { data } = await this.client.post(`/extend/${userId}`, {
      extensionDays,
      reason,
    });
    return data;
  }
}

export const slaClient = new SLAClient();
```

---

## React Hooks

Create custom hooks for SLA data:

```typescript
// hooks/useSLA.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaClient } from '@/lib/sla-client';
import { SLATier } from '@/types/sla.types';

export function useSLAEligibility(userId: string, tier: SLATier) {
  return useQuery({
    queryKey: ['sla-eligibility', userId, tier],
    queryFn: () => slaClient.checkEligibility(userId, tier),
    enabled: !!userId && !!tier,
  });
}

export function useSLAStatus(userId: string) {
  return useQuery({
    queryKey: ['sla-status', userId],
    queryFn: () => slaClient.getStatus(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useSLADashboard(userId: string) {
  return useQuery({
    queryKey: ['sla-dashboard', userId],
    queryFn: () => slaClient.getDashboard(userId),
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useCreateSLAContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      tier,
      paymentIntentId,
    }: {
      userId: string;
      tier: SLATier;
      paymentIntentId: string;
    }) => slaClient.createContract(userId, tier, paymentIntentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['sla-dashboard', variables.userId] });
    },
  });
}

export function useTrackApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: slaClient.trackApplication,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['sla-dashboard', variables.userId] });
    },
  });
}

export function useTrackInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: slaClient.trackInterview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla-status', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['sla-dashboard', variables.userId] });
    },
  });
}
```

---

## Components

### SLA Pricing Card

```typescript
// components/SLAPricingCard.tsx

import React from 'react';
import { Check } from 'lucide-react';
import { SLATier } from '@/types/sla.types';

interface SLAPricingCardProps {
  tier: SLATier;
  name: string;
  price: number;
  guaranteedInterviews: number;
  deadlineDays: number;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
}

export function SLAPricingCard({
  tier,
  name,
  price,
  guaranteedInterviews,
  deadlineDays,
  features,
  isPopular,
  onSelect,
}: SLAPricingCardProps) {
  return (
    <div className={`relative border rounded-lg p-6 ${isPopular ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-gray-600">/contract</span>
        </div>
        <div className="text-sm text-gray-600">
          <div className="font-semibold text-lg text-blue-600 mb-1">
            {guaranteedInterviews} Guaranteed Interviews
          </div>
          <div>in {deadlineDays} days</div>
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}
```

### SLA Dashboard Widget

```typescript
// components/SLADashboard.tsx

import React from 'react';
import { useSLADashboard } from '@/hooks/useSLA';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, TrendingUp, Target } from 'lucide-react';

interface SLADashboardProps {
  userId: string;
}

export function SLADashboard({ userId }: SLADashboardProps) {
  const { data: dashboard, isLoading, error } = useSLADashboard(userId);

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  if (error || !dashboard) {
    return <div className="text-red-600">Failed to load SLA dashboard</div>;
  }

  const { contract, analytics, milestones, recommendations } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-6 h-6" />}
          label="Interviews Secured"
          value={`${contract.totalInterviewsScheduled} / ${contract.guaranteedInterviews}`}
          color="blue"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Days Remaining"
          value={contract.daysRemaining}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Response Rate"
          value={`${contract.responseRate.toFixed(1)}%`}
          color="green"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Applications Sent"
          value={contract.totalApplicationsSent}
          color="orange"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Interview Guarantee Progress</h3>
          <span className="text-sm text-gray-600">
            {contract.progressPercentage.toFixed(0)}% Complete
          </span>
        </div>
        <Progress value={contract.progressPercentage} className="h-3" />
        {contract.isGuaranteeMet ? (
          <p className="text-sm text-green-600 mt-2 font-medium">
            🎉 Congratulations! You've met your interview guarantee!
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            {contract.guaranteedInterviews - contract.totalInterviewsScheduled} more interviews needed
          </p>
        )}
      </div>

      {/* Analytics */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Performance Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnalyticItem
            label="Applications per Day"
            value={analytics.applicationsPerDay.toFixed(1)}
          />
          <AnalyticItem
            label="Interview Rate"
            value={`${analytics.interviewRate.toFixed(1)}%`}
          />
          <AnalyticItem
            label="Projected Interviews"
            value={analytics.projectedInterviews}
            highlight={analytics.onTrackToMeetGuarantee}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Milestones</h3>
        <div className="space-y-3">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{milestone.title}</span>
                <span className="text-sm text-gray-600">
                  {milestone.current} / {milestone.target}
                </span>
              </div>
              <Progress
                value={(milestone.current / milestone.target) * 100}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-900">Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function AnalyticItem({ label, value, highlight }: any) {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-green-600' : ''}`}>
        {value}
      </div>
    </div>
  );
}
```

### Eligibility Checker

```typescript
// components/SLAEligibilityChecker.tsx

import React from 'react';
import { useSLAEligibility } from '@/hooks/useSLA';
import { SLATier } from '@/types/sla.types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SLAEligibilityCheckerProps {
  userId: string;
  tier: SLATier;
  onEligible: () => void;
}

export function SLAEligibilityChecker({
  userId,
  tier,
  onEligible,
}: SLAEligibilityCheckerProps) {
  const { data: eligibility, isLoading } = useSLAEligibility(userId, tier);

  if (isLoading) {
    return <div>Checking eligibility...</div>;
  }

  if (!eligibility) {
    return <div>Failed to check eligibility</div>;
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className={`flex items-center gap-2 p-4 rounded-lg ${
        eligibility.isEligible
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200'
      }`}>
        {eligibility.isEligible ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-semibold text-green-900">You're Eligible!</div>
              <div className="text-sm text-green-700">
                You meet all requirements for the {tier} tier
              </div>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-semibold text-red-900">Not Eligible Yet</div>
              <div className="text-sm text-red-700">
                Please complete the requirements below
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile Completeness */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Profile Completeness</span>
          <span className="text-sm text-gray-600">
            {eligibility.checkResult.profileCompleteness}%
          </span>
        </div>
        <Progress value={eligibility.checkResult.profileCompleteness} className="h-2" />
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <h4 className="font-medium">Requirements</h4>
        {eligibility.checkResult.passedFields.map((field) => (
          <RequirementItem key={field} label={formatFieldName(field)} passed={true} />
        ))}
        {eligibility.checkResult.failedFields.map((field) => (
          <RequirementItem key={field} label={formatFieldName(field)} passed={false} />
        ))}
      </div>

      {/* Recommendations */}
      {eligibility.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900 mb-2">Next Steps</div>
              <ul className="space-y-1 text-sm text-yellow-800">
                {eligibility.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      {eligibility.isEligible && (
        <button
          onClick={onEligible}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
        >
          Continue to Purchase
        </button>
      )}
    </div>
  );
}

function RequirementItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
      <span className={passed ? 'text-gray-700' : 'text-gray-500'}>{label}</span>
    </div>
  );
}

function formatFieldName(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

---

## Usage Examples

### Complete Purchase Flow

```typescript
// pages/sla/purchase.tsx

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { SLAPricingCard } from '@/components/SLAPricingCard';
import { SLAEligibilityChecker } from '@/components/SLAEligibilityChecker';
import { useCreateSLAContract } from '@/hooks/useSLA';
import { loadStripe } from '@stripe/stripe-js';
import { SLATier } from '@/types/sla.types';

const TIER_CONFIGS = {
  [SLATier.PROFESSIONAL]: {
    name: 'Professional',
    price: 89.99,
    guaranteedInterviews: 3,
    deadlineDays: 60,
    features: [
      'AI-powered job matching',
      'Auto-apply to jobs',
      'Resume optimization',
      'Email support',
    ],
  },
  [SLATier.PREMIUM]: {
    name: 'Premium',
    price: 149.99,
    guaranteedInterviews: 5,
    deadlineDays: 45,
    features: [
      'All Professional features',
      'Priority application processing',
      'Advanced analytics',
      'Interview prep resources',
      'Priority support',
    ],
  },
  [SLATier.ELITE]: {
    name: 'Elite',
    price: 299.99,
    guaranteedInterviews: 10,
    deadlineDays: 30,
    features: [
      'All Premium features',
      'Dedicated recruiter support',
      'Custom job search strategy',
      'Direct employer connections',
      'Salary negotiation assistance',
      '24/7 priority support',
    ],
  },
};

export default function SLAPurchasePage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<SLATier | null>(null);
  const [showEligibility, setShowEligibility] = useState(false);
  const createContract = useCreateSLAContract();

  const handleTierSelect = (tier: SLATier) => {
    setSelectedTier(tier);
    setShowEligibility(true);
  };

  const handleProceedToPurchase = async () => {
    if (!selectedTier) return;

    try {
      // Load Stripe
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

      // Create payment intent
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: TIER_CONFIGS[selectedTier].price * 100,
          tier: selectedTier,
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm payment
      const result = await stripe!.confirmCardPayment(clientSecret);

      if (result.error) {
        alert(result.error.message);
        return;
      }

      // Create SLA contract
      await createContract.mutateAsync({
        userId: 'current-user-id', // Get from auth context
        tier: selectedTier,
        paymentIntentId,
      });

      // Redirect to dashboard
      router.push('/dashboard/sla');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  if (showEligibility && selectedTier) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => setShowEligibility(false)}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← Back to pricing
        </button>
        <h1 className="text-3xl font-bold mb-6">Eligibility Check</h1>
        <SLAEligibilityChecker
          userId="current-user-id"
          tier={selectedTier}
          onEligible={handleProceedToPurchase}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Interview Guarantee Plan</h1>
        <p className="text-xl text-gray-600">
          Get guaranteed interviews or your money back
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(TIER_CONFIGS).map(([tier, config]) => (
          <SLAPricingCard
            key={tier}
            tier={tier as SLATier}
            {...config}
            isPopular={tier === SLATier.PREMIUM}
            onSelect={() => handleTierSelect(tier as SLATier)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Dashboard Page

```typescript
// pages/dashboard/sla.tsx

import React from 'react';
import { SLADashboard } from '@/components/SLADashboard';
import { useSLAStatus } from '@/hooks/useSLA';

export default function SLADashboardPage() {
  const userId = 'current-user-id'; // Get from auth context
  const { data: status, isLoading } = useSLAStatus(userId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!status) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold mb-4">No Active SLA Contract</h2>
        <p className="text-gray-600 mb-6">
          Purchase an interview guarantee plan to get started
        </p>
        <a
          href="/sla/purchase"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
        >
          View Plans
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Interview Guarantee</h1>
        <p className="text-gray-600">
          {status.tier.charAt(0).toUpperCase() + status.tier.slice(1)} Plan
        </p>
      </div>

      <SLADashboard userId={userId} />
    </div>
  );
}
```

---

## Additional Tips

### Error Handling

```typescript
// Always handle errors gracefully
const { data, error, isError } = useSLAStatus(userId);

if (isError) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800">
        {error?.message || 'Failed to load SLA data'}
      </p>
    </div>
  );
}
```

### Loading States

```typescript
// Show skeleton loaders while data is fetching
{isLoading && (
  <div className="space-y-4">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
)}
```

### Real-time Updates

```typescript
// Use refetch intervals for live data
const { data } = useSLADashboard(userId, {
  refetchInterval: 30000, // 30 seconds
  refetchOnWindowFocus: true,
});
```

---

This completes the frontend integration examples. You now have everything needed to build a complete SLA experience in your React application!
