# JobPilot Mobile App - EAS Configuration Guide

## Overview

This document provides comprehensive instructions for setting up and using Expo Application Services (EAS) for the JobPilot mobile application.

## Prerequisites

1. **Expo CLI** - Install globally:
   ```bash
   npm install -g expo-cli eas-cli
   ```

2. **Expo Account** - Sign up at [expo.dev](https://expo.dev)

3. **Apple Developer Account** - Required for iOS builds ($99/year)

4. **Google Play Developer Account** - Required for Android builds ($25 one-time fee)

## Initial Setup

### 1. Install Dependencies

```bash
cd apps/mobile
npm install expo-notifications expo-device expo-constants expo-web-browser
```

### 2. Login to EAS

```bash
eas login
```

### 3. Configure EAS Project

```bash
eas init
```

This will create an EAS project and update your `app.json` with the project ID.

### 4. Update Configuration Files

Update the following placeholders in your configuration files:

#### app.json
- `YOUR_EAS_PROJECT_ID` - Replace with your actual EAS project ID from `eas init`

#### eas.json
- `YOUR_APPLE_ID` - Your Apple Developer account email
- `YOUR_ASC_APP_ID` - App Store Connect App ID (create app first)
- `YOUR_APPLE_TEAM_ID` - Apple Developer Team ID

## Build Profiles

### Development Build

Internal testing with development client:

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android

# Both platforms
eas build --profile development --platform all
```

**Features:**
- Debug mode enabled
- Development client included
- iOS: Can run on simulator
- Android: APK format for easy installation

### Preview Build

Release build for internal testing:

```bash
# iOS
eas build --profile preview --platform ios

# Android
eas build --profile preview --platform android
```

**Features:**
- Release mode with optimizations
- Internal distribution (TestFlight, Internal Testing)
- iOS: Can distribute via TestFlight
- Android: APK format for direct installation

### Production Build

App store submission builds:

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

**Features:**
- Full optimizations
- Store-ready format
- iOS: IPA for App Store
- Android: AAB for Google Play
- Auto-incrementing build numbers

## Credentials Setup

### iOS Credentials

EAS can automatically manage your iOS credentials, or you can provide them manually.

#### Automatic (Recommended)

```bash
eas credentials
```

EAS will guide you through:
- Creating/using Distribution Certificate
- Creating/using Provisioning Profiles
- Configuring Push Notification certificates

#### Manual

1. **Distribution Certificate**
   - Export from Apple Developer Portal
   - Upload via `eas credentials`

2. **Provisioning Profile**
   - Create in Apple Developer Portal
   - Upload via `eas credentials`

3. **Push Notification Key**
   - Create in Apple Developer Portal (Keys section)
   - Upload via `eas credentials`

### Android Credentials

#### Generate Keystore

```bash
eas credentials
```

Select "Generate new keystore" for production builds.

#### Google Services Setup

1. Create a project in [Firebase Console](https://console.firebase.google.com)
2. Add Android app with package name: `com.jobpilot.app`
3. Download `google-services.json`
4. Place at: `apps/mobile/android/google-services.json`

For iOS:
1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Place at: `apps/mobile/ios/GoogleService-Info.plist`

## Push Notifications Setup

### iOS

1. **Create APNs Key** (if not already done):
   - Go to Apple Developer Portal > Certificates, IDs & Profiles > Keys
   - Create new key with Push Notifications enabled
   - Download and save the key file

2. **Upload to Expo**:
   ```bash
   eas credentials
   ```
   - Select iOS > Push Notifications
   - Upload the APNs key

### Android

1. **Firebase Cloud Messaging**:
   - Already configured via `google-services.json`
   - FCM automatically handles push notifications

2. **Server Key**:
   - Get from Firebase Console > Project Settings > Cloud Messaging
   - Use this in your backend to send notifications

## Deep Linking Setup

### iOS Universal Links

1. **Configure Associated Domains**:
   - Add to Apple Developer Portal for your App ID
   - Domains: `applinks:jobpilot.app`, `applinks:*.jobpilot.app`

2. **Host apple-app-site-association file**:
   Create file at `https://jobpilot.app/.well-known/apple-app-site-association`:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "YOUR_TEAM_ID.com.jobpilot.app",
           "paths": ["*"]
         }
       ]
     }
   }
   ```

### Android App Links

1. **Host assetlinks.json file**:
   Create file at `https://jobpilot.app/.well-known/assetlinks.json`:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.jobpilot.app",
         "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
       }
     }
   ]
   ```

2. **Get SHA256 Fingerprint**:
   ```bash
   eas credentials
   ```
   Select Android > View credentials > Copy SHA256 fingerprint

## Submission

### iOS App Store

1. **Create App in App Store Connect**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Fill in app information

2. **Submit with EAS**:
   ```bash
   eas submit --profile production --platform ios
   ```

3. **Review Process**:
   - Typically takes 1-3 days
   - Respond to any App Review feedback

### Google Play Store

1. **Create App in Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Fill in store listing

2. **Submit with EAS**:
   ```bash
   eas submit --profile production --platform android
   ```

3. **Review Process**:
   - Typically takes a few hours to 1-2 days
   - May require additional information

## OTA Updates

Over-the-air updates allow you to push JavaScript changes without rebuilding.

### Configure Updates

Already configured in `app.json`:
```json
{
  "updates": {
    "url": "https://u.expo.dev/YOUR_EAS_PROJECT_ID"
  }
}
```

### Publish Update

```bash
# Development channel
eas update --branch development --message "Bug fixes"

# Preview channel
eas update --branch preview --message "New features"

# Production channel
eas update --branch production --message "Security update"
```

### Check for Updates

The app automatically checks for updates on launch. You can also manually check:

```typescript
import * as Updates from 'expo-updates';

async function checkForUpdates() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  }
}
```

## Testing

### Internal Testing

#### iOS (TestFlight)

1. Build with preview profile
2. Submit to TestFlight:
   ```bash
   eas submit --profile preview --platform ios
   ```
3. Add testers in App Store Connect
4. Testers receive invite via email

#### Android (Internal Testing)

1. Build with preview profile
2. Submit to Play Console:
   ```bash
   eas submit --profile preview --platform android
   ```
3. Add testers via email in Play Console
4. Testers can install via Play Store

### External Testing

#### iOS (TestFlight External Testing)

- Same as internal, but requires App Review
- Allows up to 10,000 testers
- Public link available

#### Android (Closed Testing)

- Create closed testing track in Play Console
- Add testers via email or Google Group
- Requires initial review

## Environment Variables

Set environment variables for different build profiles:

```bash
# Development
eas build --profile development --platform all

# Preview
eas build --profile preview --platform all

# Production
eas build --profile production --platform all
```

Access in code:
```typescript
import Constants from 'expo-constants';

const env = process.env.APP_ENV || 'development';
const apiUrl = Constants.expoConfig?.extra?.apiUrl[env];
```

## Troubleshooting

### Build Failures

1. **Check build logs**:
   ```bash
   eas build:list
   ```
   Click on failed build for detailed logs

2. **Common issues**:
   - Missing credentials
   - Invalid bundle identifier
   - Provisioning profile issues
   - Native dependency conflicts

### Push Notifications Not Working

1. **iOS**:
   - Verify APNs key is uploaded
   - Check associated domains configuration
   - Ensure app has notification permissions

2. **Android**:
   - Verify `google-services.json` is present
   - Check FCM configuration
   - Ensure app has notification permissions

### Deep Links Not Working

1. **Verify configuration**:
   - Check `app.json` scheme and associated domains
   - Verify `.well-known` files are accessible
   - Test with `npx uri-scheme open applyforus://jobs/123 --ios`

2. **iOS Universal Links**:
   - Must be hosted over HTTPS
   - File must be served with correct content-type
   - May take time to propagate

3. **Android App Links**:
   - Verify SHA256 fingerprint matches
   - Test with `adb shell am start -a android.intent.action.VIEW -d "https://jobpilot.app/jobs/123"`

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Expo Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Deep Linking Guide](https://docs.expo.dev/guides/linking/)

## Support

For issues or questions:
1. Check [Expo Forums](https://forums.expo.dev)
2. Review [Expo Discord](https://chat.expo.dev)
3. Open issue on project repository

## Next Steps

1. ✅ Configure EAS project ID
2. ✅ Set up credentials for iOS and Android
3. ✅ Configure push notifications
4. ✅ Set up deep linking domains
5. ✅ Test builds locally
6. ✅ Submit to TestFlight/Internal Testing
7. ✅ Gather feedback
8. ✅ Submit to production stores

## API Integration

The notification and deep linking services require backend API endpoints:

### Notification Endpoints

```typescript
// Register device token
POST /api/notifications/register
{
  "token": "ExponentPushToken[...]",
  "platform": "ios" | "android",
  "deviceId": "device-uuid",
  "deviceName": "User's iPhone"
}

// Unregister device token
POST /api/notifications/unregister
{
  "token": "ExponentPushToken[...]"
}

// Send notification (backend)
POST https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[...]",
  "title": "New Job Match",
  "body": "Check out this new opportunity",
  "data": {
    "type": "job",
    "id": "job-uuid"
  }
}
```

### Backend Implementation Example

```typescript
// Node.js/Express backend
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
) {
  if (!Expo.isExpoPushToken(token)) {
    console.error('Invalid Expo push token:', token);
    return;
  }

  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent:', ticket);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
```

## Security Notes

1. **Never commit credentials**:
   - Add to `.gitignore`:
     - `android/google-services.json`
     - `ios/GoogleService-Info.plist`
     - `android/service-account-key.json`

2. **Environment Variables**:
   - Use EAS Secrets for sensitive data
   - Never hardcode API keys

3. **Deep Link Validation**:
   - Always validate deep link parameters
   - Sanitize user input from URLs
   - Check authentication before navigation

4. **Push Notification Security**:
   - Validate tokens on backend
   - Rate limit notification endpoints
   - Don't send sensitive data in notifications
