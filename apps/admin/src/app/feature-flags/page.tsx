'use client';

import { useState } from 'react';
import {
  Flag,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production' | 'all';
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  targetUsers?: string[];
  conditions?: Record<string, any>;
}

const mockFeatureFlags: FeatureFlag[] = [
  {
    id: '1',
    name: 'AI Resume Builder',
    key: 'ai_resume_builder',
    description: 'Enable AI-powered resume building feature',
    enabled: true,
    environment: 'production',
    rolloutPercentage: 100,
    createdAt: '2024-01-15',
    updatedAt: '2024-02-20',
    createdBy: 'admin@jobpilot.com',
  },
  {
    id: '2',
    name: 'Video Interviews',
    key: 'video_interviews',
    description: 'Enable video interview scheduling and recording',
    enabled: true,
    environment: 'production',
    rolloutPercentage: 75,
    createdAt: '2024-02-10',
    updatedAt: '2024-03-15',
    createdBy: 'admin@jobpilot.com',
    targetUsers: ['premium', 'enterprise'],
  },
  {
    id: '3',
    name: 'Advanced Analytics',
    key: 'advanced_analytics',
    description: 'Detailed analytics and insights dashboard',
    enabled: false,
    environment: 'staging',
    rolloutPercentage: 30,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-10',
    createdBy: 'dev@jobpilot.com',
  },
  {
    id: '4',
    name: 'Social Login',
    key: 'social_login',
    description: 'Enable login via Google, LinkedIn, GitHub',
    enabled: true,
    environment: 'all',
    rolloutPercentage: 100,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-20',
    createdBy: 'admin@jobpilot.com',
  },
  {
    id: '5',
    name: 'Dark Mode',
    key: 'dark_mode',
    description: 'Enable dark mode theme support',
    enabled: true,
    environment: 'all',
    rolloutPercentage: 100,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-05',
    createdBy: 'design@jobpilot.com',
  },
  {
    id: '6',
    name: 'Referral Program',
    key: 'referral_program',
    description: 'Employee referral program features',
    enabled: false,
    environment: 'development',
    rolloutPercentage: 10,
    createdAt: '2024-03-20',
    updatedAt: '2024-03-22',
    createdBy: 'product@jobpilot.com',
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(mockFeatureFlags);
  const [searchQuery, setSearchQuery] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewFlagModal, setShowNewFlagModal] = useState(false);

  const toggleFlag = (flagId: string) => {
    setFlags(
      flags.map((flag) =>
        flag.id === flagId ? { ...flag, enabled: !flag.enabled } : flag
      )
    );
  };

  const deleteFlag = (flagId: string) => {
    if (confirm('Are you sure you want to delete this feature flag?')) {
      setFlags(flags.filter((flag) => flag.id !== flagId));
    }
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEnvironment =
      environmentFilter === 'all' ||
      flag.environment === environmentFilter ||
      flag.environment === 'all';

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'enabled' && flag.enabled) ||
      (statusFilter === 'disabled' && !flag.enabled);

    return matchesSearch && matchesEnvironment && matchesStatus;
  });

  const getEnvironmentColor = (env: FeatureFlag['environment']) => {
    switch (env) {
      case 'production':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'development':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'all':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Feature Flags
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage feature rollouts and toggles across environments
          </p>
        </div>

        <button
          onClick={() => setShowNewFlagModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Flag</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Flags
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {flags.length}
              </p>
            </div>
            <Flag className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Enabled
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {flags.filter((f) => f.enabled).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                In Production
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {flags.filter((f) => f.environment === 'production').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Partial Rollout
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {
                  flags.filter(
                    (f) => f.rolloutPercentage > 0 && f.rolloutPercentage < 100
                  ).length
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Environment Filter */}
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Feature Flags List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Flag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rollout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFlags.map((flag) => (
                <tr
                  key={flag.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Flag className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {flag.name}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                        {flag.key}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {flag.description}
                      </p>
                      {flag.targetUsers && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {flag.targetUsers.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEnvironmentColor(
                        flag.environment
                      )}`}
                    >
                      {flag.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all"
                          style={{ width: `${flag.rolloutPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {flag.rolloutPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleFlag(flag.id)}
                      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                        flag.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {flag.enabled ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      <span className="text-xs font-medium">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(flag.updatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {flag.createdBy}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFlag(flag.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFlags.length === 0 && (
          <div className="text-center py-12">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No feature flags found</p>
          </div>
        )}
      </div>
    </div>
  );
}
