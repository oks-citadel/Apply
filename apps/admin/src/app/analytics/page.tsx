'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const metrics: MetricCard[] = [
  {
    title: 'Total Revenue',
    value: formatCurrency(547890),
    change: 23.5,
    changeLabel: 'vs last month',
    icon: DollarSign,
    iconColor: 'text-green-500 bg-green-100 dark:bg-green-500/20',
  },
  {
    title: 'Active Users',
    value: formatNumber(12543),
    change: 12.8,
    changeLabel: 'vs last month',
    icon: Users,
    iconColor: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20',
  },
  {
    title: 'Job Postings',
    value: formatNumber(3847),
    change: 8.2,
    changeLabel: 'vs last month',
    icon: Briefcase,
    iconColor: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20',
  },
  {
    title: 'Applications',
    value: formatNumber(28394),
    change: -3.1,
    changeLabel: 'vs last month',
    icon: FileText,
    iconColor: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20',
  },
];

const revenueData = [
  { month: 'Jan', revenue: 42000, users: 8500, jobs: 2400 },
  { month: 'Feb', revenue: 38000, users: 9200, jobs: 2600 },
  { month: 'Mar', revenue: 45000, users: 9800, jobs: 2900 },
  { month: 'Apr', revenue: 52000, users: 10500, jobs: 3100 },
  { month: 'May', revenue: 48000, users: 11200, jobs: 3400 },
  { month: 'Jun', revenue: 55000, users: 12543, jobs: 3847 },
];

const userActivityData = [
  { date: 'Mon', active: 4200, new: 240, returning: 3960 },
  { date: 'Tue', active: 3800, new: 198, returning: 3602 },
  { date: 'Wed', active: 4500, new: 312, returning: 4188 },
  { date: 'Thu', active: 4100, new: 256, returning: 3844 },
  { date: 'Fri', active: 4800, new: 385, returning: 4415 },
  { date: 'Sat', active: 3200, new: 189, returning: 3011 },
  { date: 'Sun', active: 2900, new: 167, returning: 2733 },
];

const categoryData = [
  { name: 'Technology', value: 35, color: '#3B82F6' },
  { name: 'Healthcare', value: 22, color: '#10B981' },
  { name: 'Finance', value: 18, color: '#F59E0B' },
  { name: 'Education', value: 15, color: '#8B5CF6' },
  { name: 'Other', value: 10, color: '#6B7280' },
];

const applicationStatusData = [
  { status: 'Applied', count: 8500 },
  { status: 'Screening', count: 5200 },
  { status: 'Interview', count: 3100 },
  { status: 'Offer', count: 1800 },
  { status: 'Hired', count: 950 },
  { status: 'Rejected', count: 8844 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;

          return (
            <div
              key={metric.title}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {metric.value}
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
                      {formatPercentage(metric.change)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {metric.changeLabel}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${metric.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue and Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue and Growth Trends
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monthly performance overview
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue ($)"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="jobs"
                stroke="#F59E0B"
                name="Jobs"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Activity
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Daily active users breakdown
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="new" stackId="a" fill="#10B981" name="New Users" />
                <Bar
                  dataKey="returning"
                  stackId="a"
                  fill="#3B82F6"
                  name="Returning"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Categories Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Job Categories
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Distribution by industry
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status Funnel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Application Status Funnel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Conversion rates through the hiring process
            </p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="status" type="category" stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
