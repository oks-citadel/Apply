'use client';

import { useState } from 'react';
import {
  Database,
  HardDrive,
  Activity,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Zap,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface DatabaseMetrics {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  connections: number;
  size: string;
  uptime: string;
  queries: number;
  avgResponseTime: number;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  size: string;
  duration: string;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'full' | 'incremental';
}

const databases: DatabaseMetrics[] = [
  {
    name: 'PostgreSQL - Main',
    status: 'healthy',
    connections: 45,
    size: '2.8 GB',
    uptime: '15d 8h 23m',
    queries: 125847,
    avgResponseTime: 12,
  },
  {
    name: 'PostgreSQL - Analytics',
    status: 'healthy',
    connections: 32,
    size: '5.4 GB',
    uptime: '15d 8h 23m',
    queries: 89234,
    avgResponseTime: 28,
  },
  {
    name: 'Redis - Cache',
    status: 'healthy',
    connections: 89,
    size: '512 MB',
    uptime: '30d 12h 45m',
    queries: 2847563,
    avgResponseTime: 2,
  },
  {
    name: 'MongoDB - Logs',
    status: 'warning',
    connections: 28,
    size: '8.9 GB',
    uptime: '10d 4h 15m',
    queries: 45678,
    avgResponseTime: 45,
  },
];

const backups: BackupInfo[] = [
  {
    id: '1',
    timestamp: '2024-03-20T03:00:00Z',
    size: '2.8 GB',
    duration: '4m 32s',
    status: 'completed',
    type: 'full',
  },
  {
    id: '2',
    timestamp: '2024-03-19T15:00:00Z',
    size: '450 MB',
    duration: '1m 15s',
    status: 'completed',
    type: 'incremental',
  },
  {
    id: '3',
    timestamp: '2024-03-19T03:00:00Z',
    size: '2.7 GB',
    duration: '4m 28s',
    status: 'completed',
    type: 'full',
  },
  {
    id: '4',
    timestamp: '2024-03-18T15:00:00Z',
    size: '420 MB',
    duration: '1m 08s',
    status: 'completed',
    type: 'incremental',
  },
  {
    id: '5',
    timestamp: '2024-03-18T03:00:00Z',
    size: '2.6 GB',
    duration: '4m 45s',
    status: 'completed',
    type: 'full',
  },
];

const performanceData = [
  { time: '00:00', queries: 1200, responseTime: 15 },
  { time: '04:00', queries: 800, responseTime: 12 },
  { time: '08:00', queries: 3500, responseTime: 18 },
  { time: '12:00', queries: 5200, responseTime: 22 },
  { time: '16:00', queries: 4800, responseTime: 20 },
  { time: '20:00', queries: 2900, responseTime: 16 },
];

export default function DatabasePage() {
  const [isBackupRunning, setIsBackupRunning] = useState(false);

  const getStatusIcon = (status: DatabaseMetrics['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DatabaseMetrics['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
    }
  };

  const getBackupStatusColor = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    }
  };

  const triggerBackup = () => {
    setIsBackupRunning(true);
    setTimeout(() => {
      setIsBackupRunning(false);
      alert('Backup completed successfully!');
    }, 3000);
  };

  const totalQueries = databases.reduce((sum, db) => sum + db.queries, 0);
  const avgResponseTime =
    databases.reduce((sum, db) => sum + db.avgResponseTime, 0) / databases.length;
  const totalConnections = databases.reduce((sum, db) => sum + db.connections, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Database Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor database health, performance, and backups
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={triggerBackup}
            disabled={isBackupRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isBackupRunning ? 'Backing up...' : 'Backup Now'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Queries
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatNumber(totalQueries)}
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {avgResponseTime.toFixed(1)}ms
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Connections
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalConnections}
              </p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Databases
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {databases.length}
              </p>
            </div>
            <Database className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Database Instances */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Database Instances
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Database
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Connections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Uptime
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {databases.map((db, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {db.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(db.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          db.status
                        )}`}
                      >
                        {db.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {db.connections}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">{db.size}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatNumber(db.queries)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {db.avgResponseTime}ms
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {db.uptime}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Query Performance (24h)
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Query volume and response time over time
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="queries"
                stroke="#3B82F6"
                name="Queries"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="responseTime"
                stroke="#10B981"
                name="Response Time (ms)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Backups
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr
                  key={backup.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(backup.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        backup.type === 'full'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}
                    >
                      {backup.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {backup.size}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {backup.duration}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBackupStatusColor(
                        backup.status
                      )}`}
                    >
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
