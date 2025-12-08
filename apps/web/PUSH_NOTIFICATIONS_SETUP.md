# Push Notifications Frontend Setup Guide

This guide will help you set up push notifications in the JobPilot web application.

## Overview

The push notification system includes:
- Firebase Cloud Messaging (FCM) integration
- Service worker for background notifications
- In-app notification toast system
- Notification bell with unread count
- Notification history and preferences pages
- Automatic device registration

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. Backend notification service running (port 8007)
3. Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

The following packages need to be added to `package.json`:

```bash
npm install firebase framer-motion
```

Dependencies:
- `firebase`: ^10.7.1 (Firebase SDK for web)
- `framer-motion`: ^11.0.0 (For toast animations)

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Navigate to **Project Settings** > **General**
4. Scroll to "Your apps" and click on the Web icon (</>)
5. Register your app and copy the Firebase config

6. Get VAPID Key:
   - Go to **Project Settings** > **Cloud Messaging**
   - Under "Web configuration", find "Web Push certificates"
   - Generate a new key pair if not exists
   - Copy the VAPID key

7. Create `.env.local` file in the root of `apps/web/`:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

8. Update `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BM9vN...
```

### 3. Update Service Worker

The service worker file is located at `public/firebase-messaging-sw.js`.

**IMPORTANT:** Update the Firebase config in the service worker:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

**Note:** The service worker cannot access environment variables, so you must hardcode the config or fetch it from an endpoint.

### 4. Update next.config.js

Add service worker configuration to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5. Update Dashboard Layout

Update `apps/web/src/app/(dashboard)/layout.tsx` to include notification components:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner';
import { useAuthStore } from '@/stores/authStore';
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
      <NotificationToastContainer />
      <NotificationPermissionBanner />
    </div>
  );
}
```

### 6. Update Header Component

Update `apps/web/src/components/layout/Header.tsx` to include the NotificationBell:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

// ... in the component

{/* Replace the old notifications button with: */}
<NotificationBell />
```

### 7. Add Notification Routes to Sidebar

Update the sidebar navigation to include notification routes:

```tsx
const navigation = [
  // ... existing routes
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];
```

## File Structure

```
apps/web/
├── public/
│   └── firebase-messaging-sw.js          # Service worker for background notifications
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       ├── layout.tsx                # Updated with notification components
│   │       ├── notifications/
│   │       │   ├── page.tsx              # Notification history page
│   │       │   └── settings/
│   │       │       └── page.tsx          # Notification settings page
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx                # Updated with NotificationBell
│   │   └── notifications/
│   │       ├── NotificationBell.tsx      # Bell icon with dropdown
│   │       ├── NotificationToast.tsx     # Individual toast notification
│   │       ├── NotificationToastContainer.tsx  # Toast container
│   │       └── NotificationPermissionBanner.tsx # Permission request banner
│   ├── hooks/
│   │   └── useNotifications.ts           # Notification hooks
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase initialization
│   │   └── api/
│   │       └── notifications.ts          # Notification API client
│   └── .env.local                        # Environment variables
```

## Usage

### Requesting Notification Permission

The system automatically shows a permission banner after 3 seconds on first visit. Users can also:

1. Go to Settings > Notification Settings
2. Click "Enable Push Notifications"
3. Accept the browser prompt

### Viewing Notifications

Users can view notifications in two ways:

1. **Notification Bell**: Click the bell icon in the header to see recent notifications
2. **Notification Page**: Visit `/dashboard/notifications` for full notification history

### Managing Preferences

Users can manage notification preferences at:
- `/dashboard/notifications/settings`
- Settings page > Notifications tab

## Testing

### 1. Test Permission Request

1. Open the app in incognito mode
2. Log in
3. Wait for the permission banner to appear
4. Click "Enable Notifications"
5. Accept the browser prompt
6. Check console for FCM token

### 2. Test Foreground Notifications

With the app open:

```bash
# From the backend notification service
curl -X POST http://localhost:8007/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["your-user-id"],
    "notification": {
      "title": "Test Notification",
      "body": "This is a test notification",
      "sound": "default"
    },
    "priority": "high"
  }'
```

You should see:
1. A toast notification appear in the top-right
2. The notification bell badge update
3. The notification in the dropdown

### 3. Test Background Notifications

1. Close or minimize the app
2. Send a notification using the curl command above
3. You should see a system notification
4. Clicking it should open the app

### 4. Test Notification Preferences

1. Go to Notification Settings
2. Toggle various preferences
3. Verify changes are saved
4. Verify notifications respect preferences

## Troubleshooting

### Service Worker Not Registering

**Problem**: Service worker fails to register

**Solutions**:
1. Ensure you're using HTTPS (or localhost)
2. Check browser console for errors
3. Verify `firebase-messaging-sw.js` is in the public directory
4. Check Next.js headers configuration

### No FCM Token

**Problem**: FCM token is null or undefined

**Solutions**:
1. Verify Firebase configuration is correct
2. Check VAPID key is set in `.env.local`
3. Ensure notification permission is granted
4. Check browser console for Firebase errors
5. Verify Firebase Cloud Messaging is enabled in console

### Notifications Not Appearing

**Problem**: Notifications are sent but not displayed

**Solutions**:
1. Check browser notification settings
2. Verify device token is registered in backend
3. Check notification payload format
4. Review service worker console logs
5. Ensure notification preferences allow the category

### Background Notifications Not Working

**Problem**: Notifications only work when app is open

**Solutions**:
1. Verify service worker is active (DevTools > Application > Service Workers)
2. Check `onBackgroundMessage` handler in service worker
3. Ensure Firebase config in service worker matches .env.local
4. Test in a different browser

### Permission Denied

**Problem**: User accidentally denied notification permission

**Solutions**:
1. Clear browser data for the site
2. Reset permissions in browser settings:
   - Chrome: Settings > Privacy > Site Settings > Notifications
   - Firefox: Preferences > Privacy > Permissions > Notifications
   - Safari: Preferences > Websites > Notifications

## Security Considerations

1. **VAPID Key**: Keep your VAPID key secure. It's public but should be tracked
2. **Service Worker**: The service worker has access to all notifications
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: FCM tokens are stored in localStorage
5. **Device Registration**: Verify user owns device before registering

## Performance Tips

1. **Token Refresh**: Tokens can change, implement refresh logic
2. **Cleanup**: Remove old device tokens regularly
3. **Batching**: Use the backend queue for bulk notifications
4. **Caching**: Cache notification list with React Query
5. **Lazy Loading**: Notification components are loaded on-demand

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Web Push support (iOS 16.4+)
- Opera: Full support
- Internet Explorer: Not supported

## API Integration

The frontend integrates with the backend notification service endpoints:

- `POST /push/register` - Register device token
- `DELETE /push/unregister` - Unregister device
- `GET /push/devices/:userId` - Get registered devices
- `GET /notifications/:userId` - Get notification history
- `GET /notifications/:userId/unread-count` - Get unread count
- `PUT /notifications/:userId/:notificationId/read` - Mark as read
- `PUT /notifications/:userId/mark-all-read` - Mark all as read
- `DELETE /notifications/:userId/:notificationId` - Delete notification
- `GET /preferences/:userId` - Get notification preferences
- `PUT /preferences/:userId` - Update preferences

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

## Support

For issues or questions:
1. Check the browser console for errors
2. Review service worker logs
3. Verify Firebase configuration
4. Check backend notification service logs
5. Consult the backend PUSH_NOTIFICATION_GUIDE.md
