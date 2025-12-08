# Push Notification System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Application                         │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │ Dashboard    │  │ Notification │  │ Settings     │      │   │
│  │  │ Layout       │  │ Page         │  │ Page         │      │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                  │                  │               │   │
│  │         ▼                  ▼                  ▼               │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │           Notification Components                     │   │   │
│  │  │  • NotificationBell                                   │   │   │
│  │  │  • NotificationToastContainer                         │   │   │
│  │  │  • NotificationPermissionBanner                       │   │   │
│  │  └─────────────────────┬────────────────────────────────┘   │   │
│  │                        │                                     │   │
│  │                        ▼                                     │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │          useNotifications Hook                       │   │   │
│  │  │  • usePushNotifications()                            │   │   │
│  │  │  • useNotificationList()                             │   │   │
│  │  │  • useUnreadCount()                                  │   │   │
│  │  └─────────────────────┬───────────────────────────────┘   │   │
│  │                        │                                     │   │
│  │         ┌──────────────┼──────────────┐                    │   │
│  │         ▼              ▼               ▼                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐             │   │
│  │  │ Firebase │  │ API      │  │ React Query  │             │   │
│  │  │ FCM      │  │ Client   │  │ Cache        │             │   │
│  │  └─────┬────┘  └─────┬────┘  └──────────────┘             │   │
│  └────────┼─────────────┼─────────────────────────────────────┘   │
│           │             │                                           │
│  ┌────────▼─────────────────────────────────────────────────────┐ │
│  │            Service Worker (Background)                        │ │
│  │  • firebase-messaging-sw.js                                   │ │
│  │  • Receives background push messages                          │ │
│  │  • Shows system notifications                                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│           ▲                                                         │
└───────────┼─────────────────────────────────────────────────────────┘
            │
            │ FCM Push
            │
┌───────────▼─────────────────────────────────────────────────────┐
│                     Firebase Cloud Messaging                     │
│                         (Google Cloud)                           │
└───────────▲─────────────────────────────────────────────────────┘
            │
            │ HTTP/2
            │
┌───────────┴─────────────────────────────────────────────────────┐
│                  Backend Notification Service                    │
│                      (Port 8007)                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Push Endpoints:                                         │   │
│  │  • POST /push/register                                   │   │
│  │  • POST /push/send                                       │   │
│  │  • GET  /notifications/:userId                          │   │
│  │  • GET  /preferences/:userId                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Device Registration Flow

```
User Opens App
    │
    ▼
Check Permission
    │
    ├─────► Granted ────────┐
    │                       │
    ├─────► Default ───► Show Banner ───► Request ───┐
    │                                                  │
    └─────► Denied ────► Show Warning                │
                                                       │
                                                       ▼
                                           Get FCM Token
                                                       │
                                                       ▼
                                        POST /push/register
                                                       │
                                                       ▼
                                          Store in Backend DB
                                                       │
                                                       ▼
                                          Save Token Locally
```

### 2. Notification Delivery Flow

#### Foreground (App Open)

```
Backend Sends Notification
    │
    ▼
Firebase FCM
    │
    ▼
Browser Receives Message
    │
    ▼
onForegroundMessage Handler
    │
    ▼
Dispatch Custom Event
    │
    ▼
NotificationToastContainer
    │
    ▼
Show Toast Notification
    │
    ▼
Update Unread Count
    │
    ▼
Update Notification Bell Badge
```

#### Background (App Closed/Minimized)

```
Backend Sends Notification
    │
    ▼
Firebase FCM
    │
    ▼
Service Worker Receives Push
    │
    ▼
onBackgroundMessage Handler
    │
    ▼
Show System Notification
    │
    ▼
User Clicks Notification
    │
    ▼
Open/Focus App Window
    │
    ▼
Navigate to Action URL
```

### 3. Notification Read Flow

```
User Clicks Notification
    │
    ▼
Mark as Read Locally
    │
    ▼
PUT /notifications/:userId/:notificationId/read
    │
    ▼
Update Backend Database
    │
    ▼
Invalidate React Query Cache
    │
    ▼
Refetch Notification List
    │
    ▼
Update Unread Count
    │
    ▼
Update UI (Remove Badge)
```

## Component Hierarchy

```
DashboardLayout
├── Header
│   ├── Logo
│   ├── Dark Mode Toggle
│   ├── NotificationBell ◄─── NEW
│   │   ├── Bell Icon + Badge
│   │   └── Dropdown Menu
│   │       ├── Notification List (10 recent)
│   │       ├── Mark All Read Button
│   │       └── Settings Link
│   └── User Menu
├── Sidebar
└── Main Content
    ├── {children} (Page Content)
    ├── NotificationToastContainer ◄─── NEW
    │   └── NotificationToast[] (0-n toasts)
    └── NotificationPermissionBanner ◄─── NEW
```

## State Management

```
┌────────────────────────────────────────────────────────┐
│                   React Query Cache                     │
├────────────────────────────────────────────────────────┤
│                                                          │
│  notifications              ┌────────────────────┐     │
│  ├─ [userId, page, limit]   │  • Stale: 30s     │     │
│  └─ Data: PaginatedNotifications  • Refetch: 60s │     │
│                             └────────────────────┘     │
│  unread-count               ┌────────────────────┐     │
│  ├─ [userId]                │  • Stale: 30s     │     │
│  └─ Data: { count: number } │  • Poll: 60s      │     │
│                             └────────────────────┘     │
│  notification-preferences   ┌────────────────────┐     │
│  ├─ [userId]                │  • Stale: ∞       │     │
│  └─ Data: NotificationPreferences • Cache: ∞     │     │
│                             └────────────────────┘     │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   Local State                           │
├────────────────────────────────────────────────────────┤
│                                                          │
│  fcmToken: string | null                                │
│  permissionStatus: 'granted' | 'denied' | 'default'     │
│  toasts: ToastNotification[]                            │
│  bannerDismissed: boolean (localStorage)                │
│                                                          │
└────────────────────────────────────────────────────────┘
```

## File Organization

```
src/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx                      [Integrates Toast & Banner]
│       └── notifications/
│           ├── page.tsx                    [History Page]
│           └── settings/
│               └── page.tsx                [Settings Page]
│
├── components/
│   ├── layout/
│   │   └── Header.tsx                      [Uses NotificationBell]
│   └── notifications/
│       ├── index.ts                        [Exports]
│       ├── NotificationBell.tsx            [UI: Bell + Dropdown]
│       ├── NotificationToast.tsx           [UI: Individual Toast]
│       ├── NotificationToastContainer.tsx  [Container + Logic]
│       └── NotificationPermissionBanner.tsx [UI: Permission Request]
│
├── hooks/
│   └── useNotifications.ts                 [All Hooks]
│
└── lib/
    ├── firebase.ts                         [FCM Setup]
    └── api/
        └── notifications.ts                [API Client]
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Stack                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Framework          Next.js 14 (App Router)              │
│  UI Library         React 18                             │
│  Language           TypeScript 5                         │
│  Styling            Tailwind CSS 3                       │
│  State Management   React Query (TanStack Query)         │
│  Forms              React Hook Form + Zod                │
│  Animations         Framer Motion                        │
│  Push Messaging     Firebase Cloud Messaging             │
│  HTTP Client        Axios                                │
│  Date Utilities     date-fns                             │
│  Icons              Lucide React                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Layer 1: HTTPS                                          │
│    └─ Required for Service Workers                       │
│                                                           │
│  Layer 2: Authentication                                 │
│    ├─ JWT Token in API requests                          │
│    └─ User-specific data isolation                       │
│                                                           │
│  Layer 3: Authorization                                  │
│    ├─ Device ownership validation                        │
│    └─ Notification access control                        │
│                                                           │
│  Layer 4: Input Validation                               │
│    ├─ Zod schemas                                        │
│    ├─ XSS prevention                                     │
│    └─ Type safety                                        │
│                                                           │
│  Layer 5: Token Security                                 │
│    ├─ FCM token in localStorage                          │
│    ├─ Automatic token refresh                            │
│    └─ Secure transmission                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────┐
│                   Optimizations                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Code Splitting                                          │
│    ├─ Lazy load notification components                 │
│    ├─ Service worker separate bundle                    │
│    └─ Route-based splitting                             │
│                                                           │
│  Caching                                                 │
│    ├─ React Query stale-while-revalidate                │
│    ├─ Service worker cache                              │
│    └─ Browser notification cache                        │
│                                                           │
│  Network                                                 │
│    ├─ Polling interval: 60s                             │
│    ├─ Stale time: 30s                                   │
│    └─ Automatic retry with exponential backoff          │
│                                                           │
│  Bundle Size                                             │
│    ├─ Tree-shaking enabled                              │
│    ├─ Firebase modular SDK                              │
│    └─ Total added: ~350KB gzipped                       │
│                                                           │
│  Rendering                                               │
│    ├─ React.memo for expensive components               │
│    ├─ Virtualization ready for long lists               │
│    └─ Debounced search                                  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────────────────────────┐
│                   Error Boundaries                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Permission Errors                                       │
│    ├─ Denied → Show warning message                     │
│    ├─ Not supported → Show browser upgrade message      │
│    └─ Default → Show enable button                      │
│                                                           │
│  API Errors                                              │
│    ├─ Network error → Retry with exponential backoff    │
│    ├─ 401 Unauthorized → Refresh token or redirect      │
│    ├─ 404 Not Found → Show error state                  │
│    └─ 500 Server Error → Show retry option              │
│                                                           │
│  Firebase Errors                                         │
│    ├─ Token error → Request new token                   │
│    ├─ Service worker error → Log and fallback           │
│    └─ Message error → Log and continue                  │
│                                                           │
│  Validation Errors                                       │
│    ├─ Form validation → Show field errors               │
│    ├─ Type errors → TypeScript compile-time check       │
│    └─ Runtime errors → Zod validation                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Setup                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  CDN (Static Assets)                                     │
│    ├─ Service Worker (firebase-messaging-sw.js)         │
│    ├─ Icons and images                                  │
│    └─ Compiled JavaScript bundles                       │
│                                                           │
│  Next.js Server                                          │
│    ├─ Server-side rendering                             │
│    ├─ API route handling                                │
│    └─ Static generation                                 │
│                                                           │
│  Firebase Cloud Messaging                                │
│    ├─ Google Cloud infrastructure                       │
│    ├─ Push notification delivery                        │
│    └─ Token management                                  │
│                                                           │
│  Backend API (Port 8007)                                 │
│    ├─ Notification service                              │
│    ├─ Database (PostgreSQL)                             │
│    └─ Queue (Bull/Redis)                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Analytics

```
┌─────────────────────────────────────────────────────────┐
│                   Metrics to Track                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  User Engagement                                         │
│    ├─ Permission grant rate                             │
│    ├─ Notification click-through rate                   │
│    ├─ Notification dismiss rate                         │
│    └─ Average time to read                              │
│                                                           │
│  Technical Metrics                                       │
│    ├─ Service worker registration success rate          │
│    ├─ FCM token generation success rate                 │
│    ├─ Device registration success rate                  │
│    ├─ API response times                                │
│    └─ Error rates by type                               │
│                                                           │
│  Business Metrics                                        │
│    ├─ Daily active devices                              │
│    ├─ Notification delivery rate                        │
│    ├─ User preference changes                           │
│    └─ Notification categories usage                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ Scalability
- ✅ Reliability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ User Experience
