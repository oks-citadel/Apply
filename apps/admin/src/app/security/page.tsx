'use client';

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Lock,
  Key,
  User,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  timestamp: string;
  source: string;
  status: 'active' | 'investigating' | 'resolved';
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  success: boolean;
  reason?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  permissions: string[];
  status: 'active' | 'revoked';
}

const securityAlerts: SecurityAlert[] = [
  {
    id: '1',
    severity: 'critical',
    type: 'Multiple Failed Login Attempts',
    message: 'Detected 15 failed login attempts from IP 203.45.67.89',
    timestamp: '2024-03-20T10:30:00Z',
    source: 'Authentication Service',
    status: 'investigating',
  },
  {
    id: '2',
    severity: 'high',
    type: 'Unusual API Activity',
    message: 'API rate limit exceeded by 300% from API key abc-123',
    timestamp: '2024-03-20T09:15:00Z',
    source: 'API Gateway',
    status: 'active',
  },
  {
    id: '3',
    severity: 'medium',
    type: 'Password Policy Violation',
    message: '3 users attempted to set weak passwords',
    timestamp: '2024-03-20T08:45:00Z',
    source: 'User Service',
    status: 'resolved',
  },
  {
    id: '4',
    severity: 'low',
    type: 'Session Timeout',
    message: '245 sessions expired due to inactivity',
    timestamp: '2024-03-19T23:00:00Z',
    source: 'Session Manager',
    status: 'resolved',
  },
];

const loginAttempts: LoginAttempt[] = [
  {
    id: '1',
    email: 'admin@jobpilot.com',
    ipAddress: '192.168.1.100',
    location: 'New York, USA',
    timestamp: '2024-03-20T10:30:00Z',
    success: true,
  },
  {
    id: '2',
    email: 'user@example.com',
    ipAddress: '203.45.67.89',
    location: 'Unknown',
    timestamp: '2024-03-20T10:25:00Z',
    success: false,
    reason: 'Invalid password',
  },
  {
    id: '3',
    email: 'user@example.com',
    ipAddress: '203.45.67.89',
    location: 'Unknown',
    timestamp: '2024-03-20T10:24:00Z',
    success: false,
    reason: 'Invalid password',
  },
  {
    id: '4',
    email: 'developer@jobpilot.com',
    ipAddress: '10.0.0.50',
    location: 'San Francisco, USA',
    timestamp: '2024-03-20T09:45:00Z',
    success: true,
  },
  {
    id: '5',
    email: 'security@jobpilot.com',
    ipAddress: '172.16.0.25',
    location: 'London, UK',
    timestamp: '2024-03-20T08:30:00Z',
    success: true,
  },
];

const apiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'jp_prod_***************xyz',
    createdAt: '2024-01-15T00:00:00Z',
    lastUsed: '2024-03-20T10:30:00Z',
    permissions: ['read', 'write', 'admin'],
    status: 'active',
  },
  {
    id: '2',
    name: 'Mobile App API Key',
    key: 'jp_mobile_*************abc',
    createdAt: '2024-02-01T00:00:00Z',
    lastUsed: '2024-03-20T09:45:00Z',
    permissions: ['read', 'write'],
    status: 'active',
  },
  {
    id: '3',
    name: 'Analytics Service',
    key: 'jp_analytics_*********123',
    createdAt: '2024-02-15T00:00:00Z',
    lastUsed: '2024-03-19T18:20:00Z',
    permissions: ['read'],
    status: 'active',
  },
  {
    id: '4',
    name: 'Deprecated Integration',
    key: 'jp_old_***************old',
    createdAt: '2023-11-10T00:00:00Z',
    lastUsed: '2024-01-05T12:00:00Z',
    permissions: ['read'],
    status: 'revoked',
  },
];

export default function SecurityPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(securityAlerts);
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
    }
  };

  const getSeverityIcon = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: SecurityAlert['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
    }
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const revokeApiKey = (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      alert(`API key ${keyId} has been revoked`);
    }
  };

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const activeAlerts = alerts.filter((a) => a.status === 'active').length;
  const failedLogins = loginAttempts.filter((l) => !l.success).length;
  const activeApiKeys = apiKeys.filter((k) => k.status === 'active').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor security threats and manage access control
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical Alerts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {criticalAlerts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Threats
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {activeAlerts}
              </p>
            </div>
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Failed Logins
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {failedLogins}
              </p>
            </div>
            <Lock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active API Keys
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {activeApiKeys}
              </p>
            </div>
            <Key className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Security Alerts
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        {alert.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {alert.type}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Source: {alert.source}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login Attempts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Login Attempts
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loginAttempts.map((attempt) => (
                <tr
                  key={attempt.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {attempt.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {attempt.ipAddress}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {attempt.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(attempt.timestamp), 'MMM dd, HH:mm:ss')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {attempt.success ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Success</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Failed</span>
                        </div>
                        {attempt.reason && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {attempt.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Keys Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            API Keys
          </h2>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            <Key className="w-4 h-4" />
            <span>Generate New Key</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Used
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
              {apiKeys.map((apiKey) => (
                <tr
                  key={apiKey.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {apiKey.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {showApiKeys[apiKey.id]
                          ? apiKey.key.replace(/\*/g, 'x')
                          : apiKey.key}
                      </span>
                      <button
                        onClick={() => toggleApiKeyVisibility(apiKey.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showApiKeys[apiKey.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(apiKey.lastUsed), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        apiKey.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                      }`}
                    >
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {apiKey.status === 'active' && (
                      <button
                        onClick={() => revokeApiKey(apiKey.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Revoke
                      </button>
                    )}
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
