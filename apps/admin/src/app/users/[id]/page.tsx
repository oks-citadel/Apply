'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  UserCheck,
  AlertTriangle,
  CreditCard,
  FileText,
  Briefcase,
  Settings,
  Activity,
  LogIn,
  Key,
} from 'lucide-react';
import { format } from 'date-fns';

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  role: 'user' | 'premium' | 'admin' | 'moderator';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
  lastLoginIp: string;
  subscription: {
    tier: string;
    status: string;
    expiresAt: string;
    credits: number;
  };
  stats: {
    totalApplications: number;
    successfulApplications: number;
    resumesUploaded: number;
    coverLettersGenerated: number;
  };
  recentActivity: {
    id: string;
    action: string;
    timestamp: string;
    details: string;
  }[];
}

const mockUser: UserDetails = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  status: 'active',
  role: 'premium',
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: '2024-01-15T10:00:00Z',
  lastLoginAt: '2024-03-20T10:30:00Z',
  lastLoginIp: '192.168.1.100',
  subscription: {
    tier: 'Pro',
    status: 'active',
    expiresAt: '2024-04-15T00:00:00Z',
    credits: 150,
  },
  stats: {
    totalApplications: 45,
    successfulApplications: 12,
    resumesUploaded: 3,
    coverLettersGenerated: 28,
  },
  recentActivity: [
    {
      id: '1',
      action: 'job_application',
      timestamp: '2024-03-20T10:30:00Z',
      details: 'Applied to Software Engineer at TechCorp',
    },
    {
      id: '2',
      action: 'cover_letter_generated',
      timestamp: '2024-03-20T10:25:00Z',
      details: 'Generated AI cover letter for Google application',
    },
    {
      id: '3',
      action: 'login',
      timestamp: '2024-03-20T10:00:00Z',
      details: 'Logged in from 192.168.1.100',
    },
    {
      id: '4',
      action: 'resume_upload',
      timestamp: '2024-03-19T15:30:00Z',
      details: 'Uploaded new resume: Resume_2024_v3.pdf',
    },
    {
      id: '5',
      action: 'settings_update',
      timestamp: '2024-03-19T14:00:00Z',
      details: 'Updated notification preferences',
    },
  ],
};

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [user] = useState<UserDetails>(mockUser);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadge = (status: UserDetails['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
    };
    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      suspended: <Ban className="w-3 h-3 mr-1" />,
      pending: <Clock className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: UserDetails['role']) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400',
      moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
      premium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
      user: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'job_application':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'cover_letter_generated':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'login':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'resume_upload':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'settings_update':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`User ${user.email} has been suspended. Reason: ${suspendReason}`);
    setIsProcessing(false);
    setShowSuspendModal(false);
    setSuspendReason('');
  };

  const handleActivate = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`User ${user.email} has been activated.`);
    setIsProcessing(false);
  };

  const handleImpersonate = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In a real implementation, this would create an impersonation token
    // and redirect to the main app with admin context
    alert(`Impersonation session started for ${user.email}. You will be redirected to the user's dashboard.`);
    setIsProcessing(false);
    setShowImpersonateModal(false);
    // In production: window.location.href = `/impersonate/${user.id}?token=...`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/users"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                {user.emailVerified && (
                  <span title="Email verified">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge(user.status)}
                {getRoleBadge(user.role)}
                {user.twoFactorEnabled && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                    <Shield className="w-3 h-3 mr-1" />
                    2FA Enabled
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImpersonateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Impersonate</span>
            </button>
            {user.status === 'active' ? (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
                <span>Suspend</span>
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Activate</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
              <span>Edit User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">User ID</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Phone</span>
              <span className="text-sm text-gray-900 dark:text-white">{user.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Login</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {format(new Date(user.lastLoginAt), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last IP</span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">{user.lastLoginIp}</span>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Subscription
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tier</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400">
                {user.subscription.tier}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400">
                {user.subscription.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expires</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {format(new Date(user.subscription.expiresAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Credits</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.subscription.credits}
              </span>
            </div>
          </div>
          <Link
            href={`/subscriptions?user=${user.id}`}
            className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Subscription
          </Link>
        </div>

        {/* Usage Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usage Statistics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Applications</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.stats.totalApplications}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Successful</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {user.stats.successfulApplications}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {((user.stats.successfulApplications / user.stats.totalApplications) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Resumes Uploaded</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.stats.resumesUploaded}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cover Letters Generated</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.stats.coverLettersGenerated}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {user.recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{activity.details}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowSuspendModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Suspend User Account
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You are about to suspend the account for <strong>{user.email}</strong>.
                This will prevent them from logging in and using the platform.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                  placeholder="Enter reason for suspension..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim() || isProcessing}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Suspend Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Modal */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowImpersonateModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                  <Key className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Impersonate User
                </h3>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>Warning:</strong> You are about to impersonate <strong>{user.email}</strong>.
                  All actions taken during impersonation will be logged for audit purposes.
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You will be redirected to the main application and see everything as this user would.
                To end the session, click the &quot;End Impersonation&quot; button in the header.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowImpersonateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImpersonate}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Starting Session...' : 'Start Impersonation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
