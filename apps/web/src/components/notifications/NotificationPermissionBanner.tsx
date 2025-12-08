'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePushNotifications } from '@/hooks/useNotifications';

export const NotificationPermissionBanner = () => {
  const { isGranted, isDenied, isSupported, requestPermission, isRegistering } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('notification_banner_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner if notifications are supported but not granted and not denied
    if (isSupported && !isGranted && !isDenied) {
      // Wait 3 seconds before showing the banner
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isGranted, isDenied]);

  const handleEnable = async () => {
    await requestPermission();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Enable Push Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Get instant updates about job matches, application status changes, and interview reminders.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isRegistering}
              >
                {isRegistering ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Not Now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
