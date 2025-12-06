'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowUp, ArrowDown, Briefcase, Users, Award, FileText } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, change, changeLabel, icon, isLoading }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive && <ArrowUp className="h-4 w-4 text-green-600" />}
            {isNegative && <ArrowDown className="h-4 w-4 text-red-600" />}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span className="text-sm text-gray-500">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: {
    totalApplications: number;
    responseRate: number;
    interviewRate: number;
    offerCount: number;
    applicationsTrend?: number;
    responseTrend?: number;
    interviewTrend?: number;
    offerTrend?: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Applications"
        value={stats.totalApplications}
        change={stats.applicationsTrend}
        changeLabel="vs last month"
        icon={<Briefcase className="h-5 w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Response Rate"
        value={`${stats.responseRate}%`}
        change={stats.responseTrend}
        changeLabel="vs last month"
        icon={<Users className="h-5 w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Interview Rate"
        value={`${stats.interviewRate}%`}
        change={stats.interviewTrend}
        changeLabel="vs last month"
        icon={<FileText className="h-5 w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Offers Received"
        value={stats.offerCount}
        change={stats.offerTrend}
        changeLabel="vs last month"
        icon={<Award className="h-5 w-5" />}
        isLoading={isLoading}
      />
    </div>
  );
}
