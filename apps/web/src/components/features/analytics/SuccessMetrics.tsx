'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import type { ConversionRates } from '@/lib/api/analytics';

interface SuccessMetricsProps {
  conversionRates: ConversionRates;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  target: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

function MetricCard({ title, value, target, icon, color, description }: MetricCardProps) {
  const percentage = (value / target) * 100;
  const isAboveTarget = value >= target;

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 p-4">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }}
      />

      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <div style={{ color }}>{icon}</div>
            </div>
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {isAboveTarget ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-orange-500" />
            )}
          </div>
        </div>

        {/* Value and target */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value.toFixed(1)}%</span>
            <span className="text-sm text-gray-500">of {target}%</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color,
            }}
          />
          {/* Target marker */}
          <div
            className="absolute inset-y-0 w-0.5 bg-gray-400"
            style={{ left: '100%' }}
          />
        </div>

        {/* Progress percentage */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {percentage.toFixed(0)}% of target
          </span>
          <span
            className={`text-xs font-medium ${
              isAboveTarget ? 'text-green-600' : 'text-orange-600'
            }`}
          >
            {isAboveTarget ? 'Above Target' : 'Below Target'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SuccessMetrics({ conversionRates, isLoading = false }: SuccessMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Success Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[180px] animate-pulse bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Industry benchmarks
  const targets = {
    applicationToResponse: 30, // 30% response rate is considered good
    responseToInterview: 50, // 50% of responses leading to interviews
    interviewToOffer: 30, // 30% of interviews resulting in offers
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Success Metrics</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span>Industry Benchmarks</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Response Rate"
            value={conversionRates.applicationToResponse}
            target={targets.applicationToResponse}
            icon={<Target className="h-5 w-5" />}
            color="#3b82f6"
            description="Applications receiving a response"
          />
          <MetricCard
            title="Interview Rate"
            value={conversionRates.responseToInterview}
            target={targets.responseToInterview}
            icon={<TrendingUp className="h-5 w-5" />}
            color="#10b981"
            description="Responses leading to interviews"
          />
          <MetricCard
            title="Offer Rate"
            value={conversionRates.interviewToOffer}
            target={targets.interviewToOffer}
            icon={<Award className="h-5 w-5" />}
            color="#8b5cf6"
            description="Interviews resulting in offers"
          />
        </div>

        {/* Overall Success Score */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Overall Success Score</h4>
              <p className="text-xs text-gray-600">
                Based on your conversion rates vs. industry benchmarks
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {(
                  ((conversionRates.applicationToResponse / targets.applicationToResponse) * 100 +
                    (conversionRates.responseToInterview / targets.responseToInterview) * 100 +
                    (conversionRates.interviewToOffer / targets.interviewToOffer) * 100) /
                  3
                ).toFixed(0)}
              </div>
              <div className="text-xs text-gray-600">out of 100</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
