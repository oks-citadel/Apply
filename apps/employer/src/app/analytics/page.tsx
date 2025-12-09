'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  TrendingUp,
  Users,
  Briefcase,
  Eye,
  Calendar,
  Download,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');

  // Mock data
  const applicationTrend = [
    { date: 'Jan 1', applications: 12, views: 45 },
    { date: 'Jan 8', applications: 19, views: 52 },
    { date: 'Jan 15', applications: 25, views: 68 },
    { date: 'Jan 22', applications: 31, views: 78 },
    { date: 'Jan 29', applications: 28, views: 71 },
  ];

  const jobPerformance = [
    { job: 'Frontend Dev', applications: 45 },
    { job: 'Product Manager', applications: 32 },
    { job: 'UX Designer', applications: 28 },
    { job: 'DevOps Eng', applications: 19 },
    { job: 'Backend Dev', applications: 24 },
  ];

  const applicationStatus = [
    { name: 'Pending', value: 45, color: '#FCD34D' },
    { name: 'Reviewing', value: 32, color: '#60A5FA' },
    { name: 'Shortlisted', value: 28, color: '#34D399' },
    { name: 'Rejected', value: 19, color: '#F87171' },
  ];

  const stats = [
    {
      name: 'Total Applications',
      value: '248',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Jobs',
      value: '12',
      change: '+2',
      trend: 'up',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Profile Views',
      value: '1,234',
      change: '+18.2%',
      trend: 'up',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Avg. Time to Hire',
      value: '18 days',
      change: '-3 days',
      trend: 'down',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 pt-16">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hiring Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Track your recruitment metrics and performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="1year">Last year</option>
              </select>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div
                    className={`flex items-center text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <TrendingUp
                      className={`h-4 w-4 mr-1 ${
                        stat.trend === 'down' ? 'rotate-180' : ''
                      }`}
                    />
                    {stat.change}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Application Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Application Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Application Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Application Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {applicationStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Performance (Applications)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="job" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Most Popular Job
              </h3>
              <p className="text-xl font-bold text-gray-900">
                Senior Frontend Developer
              </p>
              <p className="text-sm text-gray-600 mt-1">45 applications</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Best Conversion Rate
              </h3>
              <p className="text-xl font-bold text-gray-900">UX Designer</p>
              <p className="text-sm text-gray-600 mt-1">32% conversion</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Peak Application Day
              </h3>
              <p className="text-xl font-bold text-gray-900">Tuesday</p>
              <p className="text-sm text-gray-600 mt-1">35% of total</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
