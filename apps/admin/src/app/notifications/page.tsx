'use client';

import { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Trash2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  targetAudience: string[];
  template?: string;
  metadata?: {
    opened?: number;
    clicked?: number;
    bounced?: number;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Feature Announcement: AI Resume Builder',
    message:
      'We are excited to announce the launch of our AI-powered resume builder...',
    type: 'email',
    status: 'sent',
    recipients: 12543,
    sentAt: '2024-03-20T10:00:00Z',
    createdAt: '2024-03-19T14:30:00Z',
    createdBy: 'marketing@applyforus.com',
    targetAudience: ['all_users'],
    metadata: {
      opened: 8234,
      clicked: 3456,
      bounced: 23,
    },
  },
  {
    id: '2',
    title: 'Weekly Job Recommendations',
    message: 'Here are your personalized job recommendations for this week...',
    type: 'email',
    status: 'scheduled',
    recipients: 8500,
    scheduledAt: '2024-03-22T09:00:00Z',
    createdAt: '2024-03-20T16:20:00Z',
    createdBy: 'system@applyforus.com',
    targetAudience: ['active_seekers'],
    template: 'weekly_recommendations',
  },
  {
    id: '3',
    title: 'Security Alert: New Login Detected',
    message: 'A new login was detected from an unrecognized device...',
    type: 'push',
    status: 'sent',
    recipients: 245,
    sentAt: '2024-03-20T08:15:00Z',
    createdAt: '2024-03-20T08:10:00Z',
    createdBy: 'security@applyforus.com',
    targetAudience: ['affected_users'],
    metadata: {
      opened: 189,
      clicked: 145,
    },
  },
  {
    id: '4',
    title: 'Maintenance Scheduled',
    message: 'Scheduled maintenance will occur on March 25th...',
    type: 'in-app',
    status: 'scheduled',
    recipients: 12543,
    scheduledAt: '2024-03-24T18:00:00Z',
    createdAt: '2024-03-20T12:00:00Z',
    createdBy: 'operations@applyforus.com',
    targetAudience: ['all_users'],
  },
  {
    id: '5',
    title: 'Application Status Update',
    message: 'Your application for Software Engineer at TechCorp has been...',
    type: 'sms',
    status: 'sent',
    recipients: 1250,
    sentAt: '2024-03-19T15:30:00Z',
    createdAt: '2024-03-19T15:25:00Z',
    createdBy: 'notifications@applyforus.com',
    targetAudience: ['applicants'],
    template: 'application_update',
    metadata: {
      opened: 1180,
      bounced: 15,
    },
  },
  {
    id: '6',
    title: 'Premium Subscription Offer',
    message: 'Upgrade to Premium and get 30% off for the first 3 months...',
    type: 'email',
    status: 'draft',
    recipients: 5000,
    createdAt: '2024-03-20T11:00:00Z',
    createdBy: 'sales@applyforus.com',
    targetAudience: ['free_users'],
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'push':
        return <Bell className="w-5 h-5" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5" />;
      case 'in-app':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'push':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400';
      case 'sms':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'in-app':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'draft':
        return <Edit className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400';
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;

    const matchesStatus =
      statusFilter === 'all' || notification.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const deleteNotification = (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  const totalSent = notifications.filter((n) => n.status === 'sent').length;
  const totalScheduled = notifications.filter((n) => n.status === 'scheduled').length;
  const totalDrafts = notifications.filter((n) => n.status === 'draft').length;
  const totalRecipients = notifications.reduce((sum, n) => sum + n.recipients, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and send notifications to users
          </p>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Notification</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Sent
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalSent}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Scheduled
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalScheduled}
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Drafts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalDrafts}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Recipients
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalRecipients.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="in-app">In-App</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      notification.type
                    )}`}
                  >
                    {getTypeIcon(notification.type)}
                    <span className="ml-1">{notification.type}</span>
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      notification.status
                    )}`}
                  >
                    {notification.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {notification.message}
                </p>

                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{notification.recipients.toLocaleString()} recipients</span>
                  </div>
                  <div>
                    Created by {notification.createdBy} on{' '}
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                  </div>
                  {notification.scheduledAt && (
                    <div>
                      Scheduled for{' '}
                      {format(new Date(notification.scheduledAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                  {notification.sentAt && (
                    <div>
                      Sent on {format(new Date(notification.sentAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {notification.metadata && (
                  <div className="mt-4 flex items-center space-x-6 text-sm">
                    {notification.metadata.opened && (
                      <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                        <Eye className="w-4 h-4" />
                        <span>{notification.metadata.opened} opened</span>
                      </div>
                    )}
                    {notification.metadata.clicked && (
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{notification.metadata.clicked} clicked</span>
                      </div>
                    )}
                    {notification.metadata.bounced && (
                      <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>{notification.metadata.bounced} bounced</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No notifications found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for Edit icon (since it's not in lucide-react)
function Edit({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
