'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  latency: number;
  uptime: number;
  lastCheck: string;
  region: string;
  cpu?: number;
  memory?: number;
  connections?: number;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

interface ErrorEvent {
  id: string;
  service: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  status: 'open' | 'investigating' | 'resolved';
}

const mockServices: ServiceHealth[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    status: 'healthy',
    latency: 45,
    uptime: 99.99,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 23,
    memory: 45,
    connections: 1250,
  },
  {
    id: 'user-service',
    name: 'User Service',
    status: 'healthy',
    latency: 32,
    uptime: 99.98,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 18,
    memory: 38,
    connections: 890,
  },
  {
    id: 'job-service',
    name: 'Job Service',
    status: 'degraded',
    latency: 156,
    uptime: 99.85,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 67,
    memory: 72,
    connections: 2340,
  },
  {
    id: 'ai-service',
    name: 'AI Service',
    status: 'healthy',
    latency: 890,
    uptime: 99.95,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 45,
    memory: 68,
    connections: 450,
  },
  {
    id: 'payment-service',
    name: 'Payment Service',
    status: 'healthy',
    latency: 78,
    uptime: 99.99,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 12,
    memory: 25,
    connections: 320,
  },
  {
    id: 'postgres-primary',
    name: 'PostgreSQL Primary',
    status: 'healthy',
    latency: 5,
    uptime: 100,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 35,
    memory: 58,
    connections: 450,
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    status: 'healthy',
    latency: 2,
    uptime: 99.99,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 8,
    memory: 42,
    connections: 3200,
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    status: 'healthy',
    latency: 15,
    uptime: 99.97,
    lastCheck: '2024-03-20T10:30:00Z',
    region: 'us-east-1',
    cpu: 28,
    memory: 65,
  },
];

const mockMetrics: SystemMetric[] = [
  { name: 'Active Users (24h)', value: 8543, unit: '', change: 12.5, status: 'good' },
  { name: 'Requests/sec', value: 1234, unit: '', change: 5.2, status: 'good' },
  { name: 'Error Rate', value: 0.05, unit: '%', change: -15, threshold: 1, status: 'good' },
  { name: 'Avg Response Time', value: 145, unit: 'ms', change: -8.3, threshold: 500, status: 'good' },
  { name: 'Queue Depth', value: 342, unit: '', change: 45, threshold: 1000, status: 'warning' },
  { name: 'Cache Hit Rate', value: 94.5, unit: '%', change: 2.1, status: 'good' },
];

const mockErrors: ErrorEvent[] = [
  {
    id: 'err-1',
    service: 'job-service',
    message: 'Connection timeout to external API',
    count: 156,
    firstSeen: '2024-03-20T08:15:00Z',
    lastSeen: '2024-03-20T10:28:00Z',
    status: 'investigating',
  },
  {
    id: 'err-2',
    service: 'ai-service',
    message: 'Rate limit exceeded for OpenAI API',
    count: 23,
    firstSeen: '2024-03-20T09:45:00Z',
    lastSeen: '2024-03-20T10:15:00Z',
    status: 'open',
  },
  {
    id: 'err-3',
    service: 'user-service',
    message: 'Invalid JWT token format',
    count: 8,
    firstSeen: '2024-03-20T10:00:00Z',
    lastSeen: '2024-03-20T10:25:00Z',
    status: 'open',
  },
  {
    id: 'err-4',
    service: 'payment-service',
    message: 'Stripe webhook signature verification failed',
    count: 2,
    firstSeen: '2024-03-19T23:30:00Z',
    lastSeen: '2024-03-19T23:35:00Z',
    status: 'resolved',
  },
];

export default function HealthDashboardPage() {
  const [services, setServices] = useState<ServiceHealth[]>(mockServices);
  const [metrics] = useState<SystemMetric[]>(mockMetrics);
  const [errors] = useState<ErrorEvent[]>(mockErrors);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // In production, this would fetch real data
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: ServiceStatus) => {
    const styles = {
      healthy: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
      degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
      down: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
      unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
    };
    const icons = {
      healthy: <CheckCircle className="w-3 h-3 mr-1" />,
      degraded: <AlertTriangle className="w-3 h-3 mr-1" />,
      down: <XCircle className="w-3 h-3 mr-1" />,
      unknown: <Clock className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getErrorStatusBadge = (status: ErrorEvent['status']) => {
    const styles = {
      open: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
      investigating: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;
  const overallHealth = downCount > 0 ? 'down' : degradedCount > 0 ? 'degraded' : 'healthy';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Health
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time system metrics and service status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh (30s)</span>
          </label>
          <button
            onClick={() => setLastRefresh(new Date())}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-lg p-4 ${
        overallHealth === 'healthy'
          ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/50'
          : overallHealth === 'degraded'
          ? 'bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/50'
          : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {overallHealth === 'healthy' ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : overallHealth === 'degraded' ? (
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
            <div>
              <p className={`font-semibold ${
                overallHealth === 'healthy'
                  ? 'text-green-800 dark:text-green-400'
                  : overallHealth === 'degraded'
                  ? 'text-yellow-800 dark:text-yellow-400'
                  : 'text-red-800 dark:text-red-400'
              }`}>
                {overallHealth === 'healthy'
                  ? 'All Systems Operational'
                  : overallHealth === 'degraded'
                  ? 'Some Services Degraded'
                  : 'System Outage Detected'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last checked: {format(lastRefresh, 'MMM dd, HH:mm:ss')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">{healthyCount} healthy</span>
            </div>
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">{degradedCount} degraded</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">{downCount} down</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {metric.name}
            </p>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {metric.value.toLocaleString()}
              </p>
              {metric.unit && (
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">{metric.unit}</span>
              )}
            </div>
            <div className="mt-1 flex items-center">
              {metric.change > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Service Status
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Latency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CPU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Memory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Connections
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        service.name.includes('PostgreSQL') || service.name.includes('Redis') || service.name.includes('Elasticsearch')
                          ? 'bg-purple-100 dark:bg-purple-500/20'
                          : 'bg-blue-100 dark:bg-blue-500/20'
                      }`}>
                        {service.name.includes('PostgreSQL') || service.name.includes('Redis') || service.name.includes('Elasticsearch') ? (
                          <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{service.region}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(service.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      service.latency > 500 ? 'text-red-600 dark:text-red-400' :
                      service.latency > 200 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {service.latency}ms
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${
                      service.uptime >= 99.9 ? 'text-green-600 dark:text-green-400' :
                      service.uptime >= 99 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {service.uptime}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {service.cpu !== undefined && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              service.cpu > 80 ? 'bg-red-500' :
                              service.cpu > 60 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${service.cpu}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{service.cpu}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {service.memory !== undefined && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              service.memory > 80 ? 'bg-red-500' :
                              service.memory > 60 ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${service.memory}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{service.memory}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {service.connections?.toLocaleString() || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Errors
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {errors.map((error) => (
            <div key={error.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {error.service}
                    </span>
                    {getErrorStatusBadge(error.status)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {error.count} occurrences
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {error.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    First seen: {format(new Date(error.firstSeen), 'MMM dd, HH:mm')} |
                    Last seen: {format(new Date(error.lastSeen), 'MMM dd, HH:mm')}
                  </p>
                </div>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
