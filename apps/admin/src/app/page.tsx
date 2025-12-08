'use client';

import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

interface StatCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
}

interface Activity {
  id: string;
  type: 'user' | 'job' | 'application' | 'system';
  message: string;
  timestamp: string;
  user?: string;
}

const stats: StatCard[] = [
  {
    title: 'Total Users',
    value: formatNumber(12543),
    change: 12.5,
    changeLabel: 'vs last month',
    icon: Users,
    iconColor: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20',
  },
  {
    title: 'Active Jobs',
    value: formatNumber(3847),
    change: 8.2,
    changeLabel: 'vs last week',
    icon: Briefcase,
    iconColor: 'text-green-500 bg-green-100 dark:bg-green-500/20',
  },
  {
    title: 'Applications',
    value: formatNumber(28394),
    change: -3.1,
    changeLabel: 'vs last month',
    icon: FileText,
    iconColor: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20',
  },
  {
    title: 'Revenue (MRR)',
    value: formatCurrency(45280),
    change: 15.3,
    changeLabel: 'vs last month',
    icon: DollarSign,
    iconColor: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20',
  },
];

const services: ServiceStatus[] = [
  { name: 'Auth Service', status: 'healthy', uptime: 99.9, responseTime: 45 },
  { name: 'User Service', status: 'healthy', uptime: 99.8, responseTime: 52 },
  { name: 'Job Service', status: 'degraded', uptime: 95.2, responseTime: 230 },
  { name: 'Resume Service', status: 'healthy', uptime: 99.7, responseTime: 78 },
  { name: 'AI Service', status: 'healthy', uptime: 99.5, responseTime: 120 },
  { name: 'Analytics Service', status: 'healthy', uptime: 99.9, responseTime: 35 },
];

const recentActivities: Activity[] = [
  {
    id: '1',
    type: 'user',
    message: 'New user registered: john.doe@example.com',
    timestamp: '2 minutes ago',
  },
  {
    id: '2',
    type: 'application',
    message: '15 new job applications submitted',
    timestamp: '5 minutes ago',
  },
  {
    id: '3',
    type: 'system',
    message: 'Database backup completed successfully',
    timestamp: '15 minutes ago',
  },
  {
    id: '4',
    type: 'job',
    message: 'New job posted: Senior React Developer at TechCorp',
    timestamp: '23 minutes ago',
  },
  {
    id: '5',
    type: 'system',
    message: 'AI Service scaled to 3 replicas',
    timestamp: '1 hour ago',
  },
];

const systemAlerts = [
  {
    id: '1',
    severity: 'warning',
    message: 'Job Service response time above threshold (230ms)',
    timestamp: '10 minutes ago',
  },
  {
    id: '2',
    severity: 'info',
    message: 'Scheduled maintenance in 2 days',
    timestamp: '1 hour ago',
  },
];

export default function DashboardPage() {
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <Activity className="w-5 h-5 text-red-500" />;
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'job':
        return <Briefcase className="w-4 h-4" />;
      case 'application':
        return <FileText className="w-4 h-4" />;
      case 'system':
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;

          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatPercentage(stat.change)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {stat.changeLabel}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Health Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Service Health Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPercentage(service.uptime, 2)} uptime
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {service.responseTime}ms
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    response
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Alerts
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/50'
                      : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {alert.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {alert.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
