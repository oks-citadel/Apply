'use client';

import { useState } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { formatPercentage } from '@/lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type ServiceStatus = 'healthy' | 'degraded' | 'down';

interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  instances: number;
  cpu: number;
  memory: number;
}

interface Metric {
  timestamp: string;
  value: number;
}

const services: Service[] = [
  {
    id: 'auth-service',
    name: 'Auth Service',
    description: 'Authentication and authorization service',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 45,
    errorRate: 0.1,
    requestsPerMinute: 1250,
    instances: 3,
    cpu: 25,
    memory: 512,
  },
  {
    id: 'user-service',
    name: 'User Service',
    description: 'User profile and preferences management',
    status: 'healthy',
    uptime: 99.8,
    responseTime: 52,
    errorRate: 0.2,
    requestsPerMinute: 980,
    instances: 3,
    cpu: 32,
    memory: 768,
  },
  {
    id: 'job-service',
    name: 'Job Service',
    description: 'Job listings and search functionality',
    status: 'degraded',
    uptime: 95.2,
    responseTime: 230,
    errorRate: 2.5,
    requestsPerMinute: 2100,
    instances: 4,
    cpu: 78,
    memory: 1536,
  },
  {
    id: 'resume-service',
    name: 'Resume Service',
    description: 'Resume parsing and management',
    status: 'healthy',
    uptime: 99.7,
    responseTime: 78,
    errorRate: 0.3,
    requestsPerMinute: 650,
    instances: 2,
    cpu: 41,
    memory: 1024,
  },
  {
    id: 'ai-service',
    name: 'AI Service',
    description: 'AI-powered job matching and recommendations',
    status: 'healthy',
    uptime: 99.5,
    responseTime: 120,
    errorRate: 0.5,
    requestsPerMinute: 450,
    instances: 3,
    cpu: 65,
    memory: 2048,
  },
  {
    id: 'analytics-service',
    name: 'Analytics Service',
    description: 'Analytics and reporting',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 35,
    errorRate: 0.1,
    requestsPerMinute: 320,
    instances: 2,
    cpu: 18,
    memory: 512,
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    description: 'Email and push notifications',
    status: 'healthy',
    uptime: 99.6,
    responseTime: 68,
    errorRate: 0.4,
    requestsPerMinute: 890,
    instances: 3,
    cpu: 29,
    memory: 384,
  },
  {
    id: 'auto-apply-service',
    name: 'Auto Apply Service',
    description: 'Automated job application processing',
    status: 'healthy',
    uptime: 99.4,
    responseTime: 95,
    errorRate: 0.6,
    requestsPerMinute: 280,
    instances: 2,
    cpu: 45,
    memory: 1024,
  },
  {
    id: 'orchestrator-service',
    name: 'Orchestrator Service',
    description: 'Service coordination and workflow management',
    status: 'healthy',
    uptime: 99.8,
    responseTime: 42,
    errorRate: 0.2,
    requestsPerMinute: 550,
    instances: 2,
    cpu: 22,
    memory: 512,
  },
  {
    id: 'web-app',
    name: 'Web Application',
    description: 'Next.js web frontend',
    status: 'healthy',
    uptime: 99.9,
    responseTime: 180,
    errorRate: 0.1,
    requestsPerMinute: 3500,
    instances: 5,
    cpu: 35,
    memory: 1024,
  },
];

// Mock data for charts
const responseTimeData: Metric[] = [
  { timestamp: '00:00', value: 45 },
  { timestamp: '04:00', value: 52 },
  { timestamp: '08:00', value: 78 },
  { timestamp: '12:00', value: 120 },
  { timestamp: '16:00', value: 95 },
  { timestamp: '20:00', value: 62 },
];

const errorRateData: Metric[] = [
  { timestamp: '00:00', value: 0.1 },
  { timestamp: '04:00', value: 0.2 },
  { timestamp: '08:00', value: 0.3 },
  { timestamp: '12:00', value: 0.8 },
  { timestamp: '16:00', value: 0.4 },
  { timestamp: '20:00', value: 0.2 },
];

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500 bg-green-50 dark:bg-green-500/10';
      case 'degraded':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10';
      case 'down':
        return 'border-red-500 bg-red-50 dark:bg-red-500/10';
    }
  };

  const healthyServices = services.filter((s) => s.status === 'healthy').length;
  const degradedServices = services.filter((s) => s.status === 'degraded').length;
  const downServices = services.filter((s) => s.status === 'down').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor health and performance of all platform services
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Service Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Healthy Services
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {healthyServices}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Degraded Services
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                {degradedServices}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Down Services
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {downServices}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${getStatusColor(
              service.status
            )}`}
            onClick={() => setSelectedService(service)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {service.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatPercentage(service.uptime, 2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  uptime
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Activity className="w-4 h-4 mr-1" />
                  Response Time
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {service.responseTime}ms
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {service.errorRate > 1 ? (
                    <TrendingUp className="w-4 h-4 mr-1 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1 text-green-500" />
                  )}
                  Error Rate
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPercentage(service.errorRate, 2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <Server className="w-3 h-3 mr-1" />
                  Instances
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {service.instances}
                </div>
              </div>
              <div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <Cpu className="w-3 h-3 mr-1" />
                  CPU
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {service.cpu}%
                </div>
              </div>
              <div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <HardDrive className="w-3 h-3 mr-1" />
                  Memory
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {service.memory}MB
                </div>
              </div>
              <div>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <Database className="w-3 h-3 mr-1" />
                  Req/min
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {service.requestsPerMinute}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Average Response Time (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={responseTimeData}>
              <defs>
                <linearGradient id="responseTime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#responseTime)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Error Rate (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={errorRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
