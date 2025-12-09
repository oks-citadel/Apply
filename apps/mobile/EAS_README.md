# JobPilot Mobile - EAS Configuration Complete

## Overview

The JobPilot mobile application is now fully configured with Expo Application Services (EAS) for building, deploying, and managing the app across iOS and Android platforms.

## What's Been Set Up

### 1. Build System (eas.json)
- **Development Profile**: Debug builds with development client for rapid iteration
- **Preview Profile**: Release builds for internal testing (TestFlight/Internal Testing)
- **Production Profile**: Store-ready builds with auto-incrementing version numbers

### 2. App Configuration (app.json)
- Deep linking scheme: `applyforus://`
- iOS Universal Links configuration
- Android App Links configuration
- Push notification permissions and background modes
- Expo plugins for notifications, routing, fonts, and splash screen
- Environment-specific API configurations

### 3. Services Layer

#### Notification Service (src/services/notifications.ts)
- Complete push notification implementation
- Permission handling (iOS & Android)
- Foreground and background notification handling
- Token registration with backend
- Local and scheduled notifications
- Interactive notification categories
- Badge management
- React hook for easy integration: `useNotifications()`

#### Deep Linking Service (src/services/deepLinking.ts)
- Custom URL scheme handling (`applyforus://`)
- Universal Links (iOS) and App Links (Android)
- Route parsing and parameter extraction
- Navigation integration with React Navigation
- External URL handling with in-app browser
- Link building and sharing utilities
- React hook for easy integration: `useDeepLinking()`

### 4. Navigation Integration
- AppNavigator updated with service initialization
- Deep link handling with automatic route navigation
- Fallback loading states
- React Navigation linking configuration

### 5. Documentation
- **QUICK_START.md** - Get started in 15 minutes
- **EAS_SETUP.md** - Comprehensive setup guide (12,000+ words)
- **CONFIGURATION_CHECKLIST.md** - All required configuration updates
- **EAS_FILES_SUMMARY.md** - Complete file overview
- **EAS_README.md** - This file

### 6. Package Scripts
Added npm scripts for common EAS operations:
```json
{
  "eas:init": "Initialize EAS project",
  "eas:login": "Login to Expo",
  "eas:credentials": "Manage credentials",
  "build:dev": "Development build",
  "build:preview": "Preview build",
  "build:prod": "Production build",
  "submit:ios": "Submit to App Store",
  "submit:android": "Submit to Google Play",
  "update:dev": "Push OTA update to development",
  "update:preview": "Push OTA update to preview",
  "update:prod": "Push OTA update to production"
}
```

## File Structure

```
apps/mobile/
├── eas.json                              # EAS build configuration
├── app.json                              # App configuration with EAS plugins
├── package.json                          # Added EAS scripts
├── .gitignore                            # Updated with credential exclusions
│
├── EAS_README.md                         # This file
├── QUICK_START.md                        # 15-minute quick start guide
├── EAS_SETUP.md                          # Comprehensive setup guide
├── CONFIGURATION_CHECKLIST.md            # Configuration reference
├── EAS_FILES_SUMMARY.md                  # Complete file overview
│
└── src/
    ├── services/
    │   ├── notifications.ts              # Push notification service (494 lines)
    │   ├── deepLinking.ts                # Deep linking service (506 lines)
    │   ├── index.ts                      # Service exports
    │   └── api.ts                        # Existing API client
    │
    └── navigation/
        └── AppNavigator.tsx              # Updated with service integration
```

## Getting Started

### For Developers (First Time Setup)

1. **Start Here**: Read `QUICK_START.md`
2. **Then**: Follow `EAS_SETUP.md` for detailed instructions
3. **Reference**: Use `CONFIGURATION_CHECKLIST.md` for all required values

### Quick Start (Already Familiar with EAS)

```bash
cd apps/mobile

# 1. Login
npm run eas:login

# 2. Initialize
npm run eas:init

# 3. Configure credentials
npm run eas:credentials

# 4. Build
npm run build:dev
```

## Required Dependencies

These packages need to be installed:

```bash
npm install expo-notifications expo-device expo-constants expo-web-browser
```

Or add to your package.json:
```json
{
  "dependencies": {
    "expo-notifications": "~0.27.0",
    "expo-device": "~6.0.0",
    "expo-constants": "~16.0.0",
    "expo-web-browser": "~13.0.0"
  }
}
```

**Note**: Use versions compatible with your Expo SDK version.

## Configuration Required

Before deploying, update these placeholders:

### 1. app.json
```json
{
  "extra": {
    "eas": {
      "projectId": "YOUR_EAS_PROJECT_ID"  // Get from: eas init
    }
  }
}
```

### 2. eas.json (for store submission)
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",           // your@email.com
        "ascAppId": "YOUR_ASC_APP_ID",        // From App Store Connect
        "appleTeamId": "YOUR_APPLE_TEAM_ID"   // From Apple Developer
      }
    }
  }
}
```

### 3. Firebase Configuration Files
Create and place:
- `android/google-services.json` (from Firebase Console)
- `ios/GoogleService-Info.plist` (from Firebase Console)

**Important**: These files are in `.gitignore` - never commit them!

### 4. Deep Linking Web Files
Host these files on your domain:
- `https://jobpilot.app/.well-known/apple-app-site-association`
- `https://jobpilot.app/.well-known/assetlinks.json`

See `CONFIGURATION_CHECKLIST.md` for exact content and instructions.

## Features Ready to Use

### Push Notifications

```typescript
import { notificationService, useNotifications } from './services/notifications';

// In a component
function MyComponent() {
  const { permission, requestPermission } = useNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('Notifications enabled!');
    }
  };

  return <Button onPress={handleEnableNotifications}>Enable Notifications</Button>;
}

// Send local notification
notificationService.sendLocalNotification({
  type: 'job',
  title: 'New Job Match',
  body: 'Check out this opportunity!',
  data: { jobId: '123' }
});
```

### Deep Linking

```typescript
import { deepLinkingService, useDeepLinking } from './services/deepLinking';

// Build links
const jobLink = deepLinkingService.buildJobDetailsLink('job-123');
// Result: applyforus://jobs/job-123

// Universal link
const universalLink = deepLinkingService.buildDeepLink(
  'jobs/:jobId',
  { jobId: 'job-123' },
  undefined,
  true // use universal link
);
// Result: https://jobpilot.app/jobs/job-123

// In a component
function MyComponent() {
  const { openUrl, openExternalUrl } = useDeepLinking();

  return (
    <>
      <Button onPress={() => openUrl('applyforus://jobs/123')}>
        Open Job
      </Button>
      <Button onPress={() => openExternalUrl('https://example.com')}>
        Open Website
      </Button>
    </>
  );
}
```

## Supported Deep Link Routes

- Jobs: `/jobs`, `/jobs/:jobId`
- Applications: `/applications`, `/applications/:applicationId`
- Profile: `/profile`, `/profile/edit`, `/settings`
- Auth: `/auth/login`, `/auth/register`, `/auth/reset-password`, `/auth/verify-email`
- Dashboard: `/dashboard`

## Backend Integration Required

Your backend needs these endpoints:

### Register Push Token
```
POST /api/notifications/register
Body: {
  "token": "ExponentPushToken[...]",
  "platform": "ios" | "android",
  "deviceId": "uuid",
  "deviceName": "Device Name"
}
```

### Unregister Push Token
```
POST /api/notifications/unregister
Body: {
  "token": "ExponentPushToken[...]"
}
```

### Send Push Notification (from backend)
```typescript
import { Expo } from 'expo-server-sdk';

const expo = new Expo();
const messages = [{
  to: 'ExponentPushToken[...]',
  sound: 'default',
  title: 'New Job Match',
  body: 'Check this out!',
  data: { type: 'job', id: '123' }
}];

await expo.sendPushNotificationsAsync(messages);
```

See `EAS_SETUP.md` for complete backend implementation examples.

## Build Profiles Explained

### Development
```bash
npm run build:dev
```
- **Purpose**: Daily development
- **Features**: Development client, debugging enabled
- **Distribution**: Internal only
- **iOS**: Can run on simulator
- **Android**: APK format

### Preview
```bash
npm run build:preview
```
- **Purpose**: Testing before production
- **Features**: Release optimizations, production-like
- **Distribution**: TestFlight (iOS), Direct download (Android)
- **iOS**: Cannot run on simulator
- **Android**: APK format for easy sharing

### Production
```bash
npm run build:prod
```
- **Purpose**: App store submission
- **Features**: Full optimizations, auto-increment versions
- **Distribution**: App Store, Google Play
- **iOS**: IPA format
- **Android**: AAB format (required by Play Store)

## OTA Updates

Push JavaScript-only updates without rebuilding:

```bash
# Update development channel
npm run update:dev

# Update preview channel
npm run update:preview

# Update production channel
npm run update:prod
```

**Note**: OTA updates only work for JavaScript changes. Native code changes require a new build.

## Security Considerations

### Never Commit These Files
Already added to `.gitignore`:
- `android/google-services.json`
- `ios/GoogleService-Info.plist`
- `android/service-account-key.json`
- `*.mobileprovision`
- `*.p12`
- `*.cer`

### Use EAS Secrets for Sensitive Data
```bash
eas secret:create --scope project --name API_KEY --value "secret"
```

### Validate Deep Links
Always sanitize parameters from deep links before using them.

### Backend Security
- Validate push tokens
- Rate limit notification endpoints
- Use HTTPS for all API calls

## Testing Checklist

Before production deployment:

- [ ] Test push notifications on physical iOS device
- [ ] Test push notifications on physical Android device
- [ ] Test deep links with custom scheme
- [ ] Test universal links (iOS)
- [ ] Test app links (Android)
- [ ] Verify navigation from deep links works
- [ ] Test authentication flow
- [ ] Verify API connectivity
- [ ] Test offline functionality
- [ ] Check app permissions (camera, notifications)
- [ ] Verify builds on different device sizes
- [ ] Test submission to TestFlight/Internal Testing

## Common Commands

```bash
# Setup
npm run eas:login
npm run eas:init
npm run eas:credentials

# Build
npm run build:dev            # Development build
npm run build:preview        # Preview build
npm run build:prod          # Production build

# Platform-specific
npm run build:dev:ios       # iOS development
npm run build:dev:android   # Android development

# Submit
npm run submit:ios          # Submit to App Store
npm run submit:android      # Submit to Google Play

# OTA Updates
npm run update:prod         # Push update to production
```

## Troubleshooting

### Build Fails
1. Check EAS dashboard for build logs
2. Verify credentials: `npm run eas:credentials`
3. Check dependencies are compatible
4. Verify app.json and eas.json syntax

### Push Notifications Don't Work
1. Test on physical device (not simulator)
2. Verify Firebase configuration
3. Check permissions are granted
4. Verify backend endpoint is working
5. Check push token is registered

### Deep Links Don't Work
1. Verify .well-known files are hosted correctly
2. Test with physical device
3. Check scheme in app.json matches
4. For universal links, wait for propagation (can take time)

### "Not Logged In" Error
```bash
npm run eas:login
```

### "Project Not Found" Error
```bash
npm run eas:init
```

## Documentation Index

1. **QUICK_START.md** - Start here! 15-minute setup guide
2. **EAS_SETUP.md** - Comprehensive guide with all details (12,000+ words)
3. **CONFIGURATION_CHECKLIST.md** - All required configuration values
4. **EAS_FILES_SUMMARY.md** - Overview of all files and changes
5. **EAS_README.md** - This file, overview and quick reference

## Support Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [Expo Forums](https://forums.expo.dev)
- [Expo Discord](https://chat.expo.dev)

## Next Steps

### Immediate (Required for Building)
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `npm run eas:login`
3. Initialize: `npm run eas:init`
4. Update project ID in app.json
5. Configure credentials: `npm run eas:credentials`
6. First build: `npm run build:dev`

### Short Term (Required for Full Functionality)
1. Install dependencies: `npm install expo-notifications expo-device expo-constants expo-web-browser`
2. Set up Firebase project
3. Download and place Firebase config files
4. Test push notifications on device
5. Test deep linking

### Before Production
1. Complete all configuration in `CONFIGURATION_CHECKLIST.md`
2. Set up deep linking domains
3. Host .well-known files
4. Create apps in App Store Connect and Play Console
5. Update submission credentials in eas.json
6. Complete testing checklist
7. Submit to stores

## Project Status

**Status**: ✅ EAS Configuration Complete

**Ready For**:
- Development builds
- Preview builds
- Production builds
- Push notifications (after Firebase setup)
- Deep linking (after domain setup)
- Store submission (after credential setup)

**Pending**:
- Firebase configuration files (user must create)
- Domain setup for universal/app links (user must host)
- Store submission credentials (user must provide)
- Backend notification endpoints (user must implement)

## Maintainers

For questions or issues with this configuration, refer to:
1. The documentation files in this directory
2. Expo official documentation
3. Project repository issues

---

**Configuration Created**: 2025-12-09

**Last Updated**: 2025-12-09

**Version**: 1.0.0
