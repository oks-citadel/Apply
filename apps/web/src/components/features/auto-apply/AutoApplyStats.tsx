'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { useAutoApplyStatus } from '@/hooks/useApplications';
import { CheckCircle, Clock, TrendingUp, Activity, Loader2 } from 'lucide-react';

export function AutoApplyStats() {
  const { data: status, isLoading } = useAutoApplyStatus();

  const stats = [
    {
      title: 'Applications Today',
      value: status?.applicationsToday || 0,
      icon: <Clock className="w-5 h-5" />,
      loading: isLoading,
    },
    {
      title: 'Total Auto-Applied',
      value: status?.totalApplications || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      loading: isLoading,
    },
    {
      title: 'Success Rate',
      value: `${status?.successRate || 0}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      loading: isLoading,
    },
    {
      title: 'Status',
      value: status?.isRunning ? 'Active' : 'Inactive',
      icon: <Activity className="w-5 h-5" />,
      loading: isLoading,
      valueColor: status?.isRunning
        ? 'text-green-600 dark:text-green-400'
        : 'text-gray-600 dark:text-gray-400',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </span>
              <div className="text-gray-400">{stat.icon}</div>
            </div>
            <div
              className={`text-3xl font-bold mb-1 ${
                stat.valueColor || 'text-gray-900 dark:text-white'
              }`}
            >
              {stat.loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
