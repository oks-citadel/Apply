'use client';

import { useState, useEffect } from 'react';
import { Bell, Smartphone, Mail, MessageSquare, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  usePushNotifications,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import type { NotificationPreferences } from '@/lib/api/notifications';

export default function NotificationSettingsPage() {
  const {
    isGranted,
    isDenied,
    isSupported,
    requestPermission,
    isRegistering,
    unregister,
    fcmToken
  } = usePushNotifications();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (
    section: 'email' | 'push' | 'sms',
    key: string,
    value: boolean
  ) => {
    if (!localPreferences) return;

    const updated = {
      ...localPreferences,
      [section]: {
        ...localPreferences[section],
        [key]: value,
      },
    };

    setLocalPreferences(updated);
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    await updatePreferences.mutateAsync(localPreferences);
  };

  const handleEnablePush = async () => {
    await requestPermission();
  };

  const handleDisablePush = async () => {
    await unregister();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage how you receive notifications and updates
        </p>
      </div>

      {/* Push Notifications Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <CardTitle>Push Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive instant notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Push notifications not supported
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Your browser does not support push notifications. Please use a modern browser
                    like Chrome, Firefox, or Safari.
                  </p>
                </div>
              </div>
            </div>
          ) : isDenied ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Push notifications blocked
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    You have blocked push notifications for this site. To enable them, please
                    update your browser settings.
                  </p>
                </div>
              </div>
            </div>
          ) : isGranted ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 dark:text-green-100">
                      Push notifications enabled
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      You will receive push notifications for enabled categories.
                    </p>
                    {fcmToken && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2 font-mono break-all">
                        Device registered
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisablePush}
                  >
                    Disable
                  </Button>
                </div>
              </div>

              {localPreferences && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Push Notification Preferences
                  </h4>
                  <NotificationToggle
                    title="Application Updates"
                    description="Status changes on your applications"
                    checked={localPreferences.push.applicationUpdates}
                    onChange={(checked) => handleToggle('push', 'applicationUpdates', checked)}
                  />
                  <NotificationToggle
                    title="New Job Matches"
                    description="Jobs that match your preferences"
                    checked={localPreferences.push.newJobs}
                    onChange={(checked) => handleToggle('push', 'newJobs', checked)}
                  />
                  <NotificationToggle
                    title="Interview Reminders"
                    description="Upcoming interview notifications"
                    checked={localPreferences.push.interviews}
                    onChange={(checked) => handleToggle('push', 'interviews', checked)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable push notifications to receive instant updates about job matches, application
                status changes, and interview reminders.
              </p>
              <Button
                onClick={handleEnablePush}
                disabled={isRegistering}
              >
                {isRegistering ? 'Enabling...' : 'Enable Push Notifications'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      {localPreferences && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Control what emails you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggle
              title="Application Updates"
              description="Email notifications when your application status changes"
              checked={localPreferences.email.applicationUpdates}
              onChange={(checked) => handleToggle('email', 'applicationUpdates', checked)}
            />
            <NotificationToggle
              title="New Job Matches"
              description="Receive emails about new jobs that match your profile"
              checked={localPreferences.email.newJobs}
              onChange={(checked) => handleToggle('email', 'newJobs', checked)}
            />
            <NotificationToggle
              title="Weekly Digest"
              description="Weekly summary of your job search activity"
              checked={localPreferences.email.weeklyDigest}
              onChange={(checked) => handleToggle('email', 'weeklyDigest', checked)}
            />
            <NotificationToggle
              title="Marketing Emails"
              description="Tips, guides, and product updates"
              checked={localPreferences.email.marketingEmails}
              onChange={(checked) => handleToggle('email', 'marketingEmails', checked)}
            />
          </CardContent>
        </Card>
      )}

      {/* SMS Notifications (Optional) */}
      {localPreferences?.sms && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <CardTitle>SMS Notifications</CardTitle>
            </div>
            <CardDescription>
              Urgent notifications via text message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggle
              title="Interview Reminders"
              description="SMS reminders for upcoming interviews"
              checked={localPreferences.sms.interviews}
              onChange={(checked) => handleToggle('sms', 'interviews', checked)}
            />
            <NotificationToggle
              title="Urgent Updates"
              description="Critical application updates via SMS"
              checked={localPreferences.sms.urgentUpdates}
              onChange={(checked) => handleToggle('sms', 'urgentUpdates', checked)}
            />
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setLocalPreferences(preferences || null)}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={updatePreferences.isPending}
        >
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationToggle = ({ title, description, checked, onChange }: NotificationToggleProps) => {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1 pr-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
};
