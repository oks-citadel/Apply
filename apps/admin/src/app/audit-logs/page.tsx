'use client';

import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Shield,
  Database,
  Settings,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string;
  userAgent: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  metadata?: Record<string, any>;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-03-20T10:30:45Z',
    user: {
      id: 'u1',
      email: 'admin@jobpilot.com',
      name: 'Admin User',
    },
    action: 'user.update',
    resource: 'User',
    resourceId: 'user_12345',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    changes: [
      { field: 'role', oldValue: 'user', newValue: 'admin' },
      { field: 'status', oldValue: 'active', newValue: 'active' },
    ],
  },
  {
    id: '2',
    timestamp: '2024-03-20T09:45:22Z',
    user: {
      id: 'u2',
      email: 'security@jobpilot.com',
      name: 'Security Admin',
    },
    action: 'security.login_failed',
    resource: 'Authentication',
    severity: 'warning',
    ipAddress: '203.45.67.89',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metadata: {
      attempts: 3,
      reason: 'invalid_password',
    },
  },
  {
    id: '3',
    timestamp: '2024-03-20T08:15:30Z',
    user: {
      id: 'u1',
      email: 'admin@jobpilot.com',
      name: 'Admin User',
    },
    action: 'feature_flag.enable',
    resource: 'FeatureFlag',
    resourceId: 'video_interviews',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    changes: [
      { field: 'enabled', oldValue: 'false', newValue: 'true' },
      { field: 'rollout_percentage', oldValue: '50', newValue: '75' },
    ],
  },
  {
    id: '4',
    timestamp: '2024-03-19T16:20:15Z',
    user: {
      id: 'u3',
      email: 'dev@jobpilot.com',
      name: 'Developer',
    },
    action: 'database.backup',
    resource: 'Database',
    severity: 'info',
    ipAddress: '10.0.0.50',
    userAgent: 'curl/7.68.0',
    metadata: {
      size: '2.5GB',
      duration: '45s',
      success: true,
    },
  },
  {
    id: '5',
    timestamp: '2024-03-19T14:55:40Z',
    user: {
      id: 'u2',
      email: 'security@jobpilot.com',
      name: 'Security Admin',
    },
    action: 'security.permission_denied',
    resource: 'API',
    resourceId: '/api/admin/users',
    severity: 'error',
    ipAddress: '172.16.0.25',
    userAgent: 'PostmanRuntime/7.32.0',
    metadata: {
      required_role: 'super_admin',
      user_role: 'admin',
    },
  },
  {
    id: '6',
    timestamp: '2024-03-19T13:30:00Z',
    user: {
      id: 'u1',
      email: 'admin@jobpilot.com',
      name: 'Admin User',
    },
    action: 'settings.update',
    resource: 'SystemSettings',
    severity: 'warning',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    changes: [
      { field: 'max_upload_size', oldValue: '10MB', newValue: '50MB' },
      { field: 'session_timeout', oldValue: '30m', newValue: '60m' },
    ],
  },
  {
    id: '7',
    timestamp: '2024-03-19T11:15:20Z',
    user: {
      id: 'u4',
      email: 'support@jobpilot.com',
      name: 'Support Team',
    },
    action: 'user.delete',
    resource: 'User',
    resourceId: 'user_67890',
    severity: 'critical',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metadata: {
      reason: 'gdpr_request',
      data_deleted: true,
    },
  },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7d');

  const getSeverityIcon = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'critical':
        return <Shield className="w-5 h-5 text-purple-500" />;
    }
  };

  const getSeverityColor = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'critical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'featureflag':
        return <Activity className="w-4 h-4" />;
      case 'systemsettings':
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === 'all' || log.severity === severityFilter;

    const matchesResource =
      resourceFilter === 'all' ||
      log.resource.toLowerCase() === resourceFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesResource;
  });

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Severity', 'IP Address'],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.user.email,
        log.action,
        log.resource,
        log.severity,
        log.ipAddress,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track all system activities and user actions
          </p>
        </div>

        <button
          onClick={exportLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Logs
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {logs.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Warnings
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {logs.filter((l) => l.severity === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Errors
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {logs.filter((l) => l.severity === 'error').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {logs.filter((l) => l.severity === 'critical').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Resources</option>
            <option value="user">User</option>
            <option value="database">Database</option>
            <option value="featureflag">Feature Flag</option>
            <option value="systemsettings">System Settings</option>
            <option value="authentication">Authentication</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Severity Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(log.severity)}
                </div>

                {/* Log Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        {getResourceIcon(log.resource)}
                        <span>{log.resource}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.action}
                      {log.resourceId && (
                        <span className="text-gray-500 dark:text-gray-400 ml-2 font-mono">
                          ({log.resourceId})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{log.user.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-mono">{log.ipAddress}</span>
                    </div>
                  </div>

                  {/* Changes */}
                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Changes:
                      </p>
                      <div className="space-y-1">
                        {log.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 dark:text-gray-400 font-mono"
                          >
                            <span className="text-gray-500 dark:text-gray-500">
                              {change.field}:
                            </span>{' '}
                            <span className="text-red-600 dark:text-red-400 line-through">
                              {change.oldValue}
                            </span>{' '}
                            <span className="text-gray-500 dark:text-gray-500">→</span>{' '}
                            <span className="text-green-600 dark:text-green-400">
                              {change.newValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Metadata:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
