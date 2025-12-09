# EAS Configuration Checklist

This checklist covers all the configuration values you need to update before deploying the JobPilot mobile application.

## Required Configuration Updates

### 1. app.json

File: `/apps/mobile/app.json`

```json
{
  "expo": {
    // Update with your actual EAS project ID after running 'eas init'
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID" // ← UPDATE THIS
      }
    }
  }
}
```

**How to get:**
1. Run `eas init` in the mobile directory
2. Copy the project ID from the output
3. Update the value in app.json

---

### 2. eas.json

File: `/apps/mobile/eas.json`

#### iOS Submission Configuration

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",           // ← UPDATE: your@email.com
        "ascAppId": "YOUR_ASC_APP_ID",        // ← UPDATE: 1234567890
        "appleTeamId": "YOUR_APPLE_TEAM_ID"   // ← UPDATE: ABC123XYZ
      }
    },
    "preview": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",           // ← UPDATE: your@email.com
        "ascAppId": "YOUR_ASC_APP_ID",        // ← UPDATE: 1234567890
        "appleTeamId": "YOUR_APPLE_TEAM_ID"   // ← UPDATE: ABC123XYZ
      }
    }
  }
}
```

**How to get:**
- `appleId`: Your Apple Developer account email
- `ascAppId`: Create app in App Store Connect → App Information → Apple ID
- `appleTeamId`: Apple Developer account → Membership → Team ID

#### Android Submission Configuration

```json
{
  "submit": {
    "production": {
      "android": {
        // Create this file from your Google Play Console
        "serviceAccountKeyPath": "./android/service-account-key.json" // ← CREATE THIS FILE
      }
    }
  }
}
```

**How to create service account key:**
1. Go to Google Play Console
2. Setup → API access
3. Create service account
4. Download JSON key file
5. Place at `/apps/mobile/android/service-account-key.json`
6. Add to `.gitignore` (IMPORTANT!)

---

### 3. Firebase Configuration

#### Android: google-services.json

File: `/apps/mobile/android/google-services.json`

**How to get:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create/select project
3. Add Android app with package: `com.jobpilot.app`
4. Download `google-services.json`
5. Place at `/apps/mobile/android/google-services.json`
6. Add to `.gitignore` (IMPORTANT!)

#### iOS: GoogleService-Info.plist

File: `/apps/mobile/ios/GoogleService-Info.plist`

**How to get:**
1. In same Firebase project
2. Add iOS app with bundle ID: `com.jobpilot.app`
3. Download `GoogleService-Info.plist`
4. Place at `/apps/mobile/ios/GoogleService-Info.plist`
5. Add to `.gitignore` (IMPORTANT!)

---

### 4. Deep Linking Configuration

#### iOS Universal Links

Host this file at: `https://jobpilot.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.jobpilot.app", // ← UPDATE: ABC123XYZ.com.jobpilot.app
        "paths": ["*"]
      }
    ]
  }
}
```

**Requirements:**
- Must be hosted at root domain over HTTPS
- No file extension
- Content-Type: `application/json`
- Must be accessible without authentication

**How to get Team ID:**
- Apple Developer account → Membership → Team ID

#### Android App Links

Host this file at: `https://jobpilot.app/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.jobpilot.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT" // ← UPDATE THIS
      ]
    }
  }
]
```

**How to get SHA256 fingerprint:**
1. Run `eas credentials` in mobile directory
2. Select Android → View credentials
3. Copy SHA-256 Fingerprint
4. Update the value in assetlinks.json

**Requirements:**
- Must be hosted at root domain over HTTPS
- Content-Type: `application/json`
- Must be accessible without authentication

---

### 5. Domain Configuration

Update the following domains based on your environment:

#### Production
- API: `https://api.jobpilot.app`
- Web: `https://jobpilot.app`

#### Preview/Staging
- API: `https://preview-api.jobpilot.app`
- Web: `https://preview.jobpilot.app`

#### Development
- API: `http://localhost:3000` (or your dev server)
- Web: `http://localhost:3001`

These are already configured in `app.json` under `extra.apiUrl` but verify they match your actual domains.

---

### 6. Backend API Endpoints

Your backend needs to implement these endpoints for the mobile app:

#### Notification Endpoints

```
POST /api/notifications/register
POST /api/notifications/unregister
```

See `EAS_SETUP.md` for detailed implementation examples.

---

## Security Checklist

### .gitignore

Ensure these files are in your `.gitignore`:

```
# Credentials - NEVER COMMIT THESE
android/google-services.json
ios/GoogleService-Info.plist
android/service-account-key.json

# EAS credentials
.expo/
```

### Environment Variables

For sensitive configuration, use EAS Secrets:

```bash
eas secret:create --scope project --name API_KEY --value "your-secret-key"
eas secret:create --scope project --name ANALYTICS_ID --value "your-analytics-id"
```

Access in code:
```typescript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.apiKey;
```

---

## Build Commands Quick Reference

```bash
# Initialize EAS
eas init

# Configure credentials
eas credentials

# Development build
eas build --profile development --platform all

# Preview build (for testing)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

---

## Testing Checklist

Before submitting to stores:

- [ ] Test deep linking with all route types
- [ ] Verify push notifications on physical devices
- [ ] Test authentication flow
- [ ] Verify API connectivity in all environments
- [ ] Test on various device sizes
- [ ] Check app icons and splash screens
- [ ] Verify app permissions (camera, notifications, etc.)
- [ ] Test offline functionality
- [ ] Check error handling and user feedback
- [ ] Verify analytics tracking

---

## Next Steps

1. **Initial Setup**
   - [ ] Run `eas init`
   - [ ] Update `YOUR_EAS_PROJECT_ID` in app.json
   - [ ] Configure credentials with `eas credentials`

2. **Firebase Setup**
   - [ ] Create Firebase project
   - [ ] Add Android app and download google-services.json
   - [ ] Add iOS app and download GoogleService-Info.plist

3. **Apple Developer Setup**
   - [ ] Enroll in Apple Developer Program
   - [ ] Create App ID with Push Notifications capability
   - [ ] Configure Associated Domains
   - [ ] Create app in App Store Connect
   - [ ] Update Apple credentials in eas.json

4. **Google Play Setup**
   - [ ] Enroll in Google Play Developer Program
   - [ ] Create app in Play Console
   - [ ] Create service account and download key
   - [ ] Update Android credentials in eas.json

5. **Deep Linking Setup**
   - [ ] Host apple-app-site-association file
   - [ ] Host assetlinks.json file
   - [ ] Verify files are accessible

6. **Build & Test**
   - [ ] Create development build
   - [ ] Test on physical devices
   - [ ] Create preview build
   - [ ] Distribute to internal testers
   - [ ] Gather feedback

7. **Production**
   - [ ] Create production builds
   - [ ] Submit to App Store
   - [ ] Submit to Google Play
   - [ ] Monitor review process

---

## Support Resources

- **EAS Documentation**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev
- **Discord**: https://chat.expo.dev
- **Stack Overflow**: Tag with `expo` and `eas`

---

## Troubleshooting

### Common Issues

1. **"Invalid project ID"**
   - Run `eas init` again
   - Verify project ID in app.json matches EAS dashboard

2. **"Credentials not found"**
   - Run `eas credentials` and configure for your platform
   - Verify Apple/Google accounts are properly set up

3. **"Build failed"**
   - Check build logs in EAS dashboard
   - Verify all dependencies are compatible
   - Check for native module issues

4. **"Deep links not working"**
   - Verify .well-known files are accessible
   - Check domain configuration in app.json
   - Test with physical device (not simulator)

5. **"Push notifications not received"**
   - Verify Firebase configuration
   - Check APNs setup for iOS
   - Test on physical device
   - Verify backend is sending to correct token

---

Last Updated: 2025-12-09
