# Quick Start Guide - Push Notifications

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd apps/web
npm install firebase framer-motion
```

### Step 2: Configure Firebase (2 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select project
3. Enable Cloud Messaging
4. Get Web credentials and VAPID key

### Step 3: Set Environment Variables (1 min)

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
NEXT_PUBLIC_NOTIFICATION_SERVICE_URL=http://localhost:8007
```

### Step 4: Update Service Worker (30 sec)

Edit `public/firebase-messaging-sw.js` - replace the config object with your Firebase credentials.

### Step 5: Integrate Components (30 sec)

**In `src/app/(dashboard)/layout.tsx`**, add:

```tsx
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner';

// Add before closing </div>:
<NotificationToastContainer />
<NotificationPermissionBanner />
```

**In `src/components/layout/Header.tsx`**, add:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Replace old notification button with:
<NotificationBell />
```

## Files Created

All files are ready to use:

### Core
- ✅ `src/lib/firebase.ts` - Firebase setup
- ✅ `src/lib/api/notifications.ts` - API client
- ✅ `src/hooks/useNotifications.ts` - React hooks
- ✅ `public/firebase-messaging-sw.js` - Service worker

### Components
- ✅ `src/components/notifications/NotificationBell.tsx`
- ✅ `src/components/notifications/NotificationToast.tsx`
- ✅ `src/components/notifications/NotificationToastContainer.tsx`
- ✅ `src/components/notifications/NotificationPermissionBanner.tsx`
- ✅ `src/components/notifications/index.ts`

### Pages
- ✅ `src/app/(dashboard)/notifications/page.tsx`
- ✅ `src/app/(dashboard)/notifications/settings/page.tsx`

### Config
- ✅ `.env.local.example` - Template
- ✅ `PUSH_NOTIFICATIONS_SETUP.md` - Full setup guide
- ✅ `PUSH_NOTIFICATIONS_IMPLEMENTATION.md` - Implementation details

## Test It

1. Start the app: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Login to dashboard
4. Wait for permission banner or go to Settings > Notification Settings
5. Click "Enable Notifications"
6. Accept browser prompt
7. Send test notification from backend

## Usage Examples

### Show Toast Programmatically

```tsx
import { showToast } from '@/components/notifications';

// Anywhere in your app
showToast({
  title: 'Application Submitted',
  message: 'Your application has been sent successfully',
  type: 'success',
  actionUrl: '/dashboard/applications',
  duration: 5000
});
```

### Use Notification Hook

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermission,
    isGranted
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {!isGranted && (
        <button onClick={requestPermission}>
          Enable Notifications
        </button>
      )}
    </div>
  );
}
```

### Get Notification List

```tsx
import { useNotificationList } from '@/hooks/useNotifications';

function NotificationList() {
  const { data, isLoading } = useNotificationList(1, 20);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.notifications.map(notification => (
        <div key={notification.id}>{notification.title}</div>
      ))}
    </div>
  );
}
```

## Common Commands

```bash
# Install dependencies
npm install firebase framer-motion

# Run development server
npm run dev

# Build for production
npm run build

# Test service worker
# Open DevTools > Application > Service Workers
```

## Troubleshooting

### No FCM Token?
- Check Firebase config in `.env.local`
- Verify VAPID key is correct
- Check browser console for errors

### Service Worker Not Registering?
- Ensure running on HTTPS or localhost
- Check `next.config.js` headers
- Clear browser cache

### Notifications Not Showing?
- Check browser notification settings
- Verify device is registered in backend
- Check service worker console

## Routes

- Notification History: `/dashboard/notifications`
- Settings: `/dashboard/notifications/settings`
- General Settings: `/dashboard/settings` (Notifications tab)

## Backend Integration

Ensure notification service is running:

```bash
cd services/notification-service
npm run start:dev
```

API should be available at: `http://localhost:8007`

## Next Steps

1. ✅ Complete setup steps above
2. Test permission request flow
3. Test foreground notifications
4. Test background notifications
5. Customize notification templates
6. Configure notification preferences
7. Deploy to production

## Need Help?

- Full Setup Guide: `PUSH_NOTIFICATIONS_SETUP.md`
- Implementation Details: `PUSH_NOTIFICATIONS_IMPLEMENTATION.md`
- Backend Guide: `services/notification-service/PUSH_NOTIFICATION_GUIDE.md`
- Firebase Docs: https://firebase.google.com/docs/cloud-messaging

---

That's it! You're ready to go. 🚀
