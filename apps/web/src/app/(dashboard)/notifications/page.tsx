'use client';

import { useState } from 'react';
import { Bell, Trash2, CheckCheck, Filter, Search, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import type { Notification } from '@/lib/api/notifications';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading, error } = useNotificationList(page, 20, filter === 'unread');
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const filteredNotifications = data?.notifications.filter((notification) => {
    const matchesSearch =
      searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || notification.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'job_match', label: 'Job Matches' },
    { value: 'application_update', label: 'Application Updates' },
    { value: 'interview_reminder', label: 'Interview Reminders' },
    { value: 'message', label: 'Messages' },
    { value: 'system_announcement', label: 'Announcements' },
    { value: 'account', label: 'Account' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with your job search activity
          </p>
        </div>
        <Link href="/dashboard/notifications/settings">
          <Button variant="outline">Notification Settings</Button>
        </Link>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categories}
              />
            </div>

            {/* Read/Unread Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                onClick={() => setFilter('unread')}
                size="sm"
              >
                Unread
              </Button>
            </div>

            {/* Mark All Read */}
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              size="sm"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-red-600 dark:text-red-400 text-center">
                Failed to load notifications
              </p>
            </div>
          ) : filteredNotifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {searchQuery || categoryFilter !== 'all'
                  ? 'No notifications match your filters'
                  : 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications?.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {Math.ceil(data.total / 20)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!data.hasMore}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

interface NotificationRowProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationRow = ({ notification, onMarkAsRead, onDelete }: NotificationRowProps) => {
  const getNotificationIcon = (category: string) => {
    const icons: Record<string, string> = {
      job_match: '💼',
      application_update: '📝',
      interview_reminder: '📅',
      message: '💬',
      system_announcement: '📢',
      account: '👤',
    };
    return icons[category] || '🔔';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      job_match: 'Job Match',
      application_update: 'Application Update',
      interview_reminder: 'Interview Reminder',
      message: 'Message',
      system_announcement: 'Announcement',
      account: 'Account',
    };
    return labels[category] || 'Notification';
  };

  const content = (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 text-3xl">
          {getNotificationIcon(notification.category)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {getCategoryLabel(notification.category)}
                </span>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
              <h3
                className={`text-base font-semibold mb-1 ${
                  !notification.read
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={onMarkAsRead}
                  className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Mark as read"
                >
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <span>
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
};
