import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// VAPID key for web push
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

// Initialize Firebase app
export const initializeFirebase = (): FirebaseApp => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
};

// Get Firebase messaging instance
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  try {
    // Check if messaging is supported (not in SSR)
    if (typeof window === 'undefined') {
      return null;
    }

    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser');
      return null;
    }

    if (!app) {
      initializeFirebase();
    }

    if (!messaging && app) {
      messaging = getMessaging(app);
    }

    return messaging || null;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Check if we're in a browser context
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this environment');
      return null;
    }

    // Check if already granted
    if (Notification.permission === 'granted') {
      return await getFCMToken();
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      return await getFCMToken();
    } else {
      console.warn('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = await getFirebaseMessaging();

    if (!messagingInstance) {
      console.warn('Firebase Messaging not available');
      return null;
    }

    if (!vapidKey) {
      console.error('VAPID key not configured');
      return null;
    }

    const token = await getToken(messagingInstance, { vapidKey });

    if (token) {
      console.log('FCM Token received:', token);
      return token;
    } else {
      console.warn('No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  getFirebaseMessaging().then((messagingInstance) => {
    if (messagingInstance) {
      return onMessage(messagingInstance, callback);
    }
  });

  return () => {};
};

// Check if notification permission is granted
export const isNotificationPermissionGranted = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Check if notification permission is denied
export const isNotificationPermissionDenied = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'denied';
};

// Get current notification permission status
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
