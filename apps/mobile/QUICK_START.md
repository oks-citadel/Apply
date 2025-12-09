# EAS Quick Start Guide

Get your JobPilot mobile app built and deployed in 15 minutes!

## Prerequisites

- Node.js 18+ installed
- Expo account (sign up at [expo.dev](https://expo.dev))
- Apple Developer account (for iOS) or Google Play account (for Android)

## Step 1: Install EAS CLI (2 minutes)

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo (1 minute)

```bash
cd apps/mobile
npm run eas:login
# or: eas login
```

## Step 3: Initialize EAS (2 minutes)

```bash
npm run eas:init
# or: eas init
```

This will:
- Create an EAS project
- Give you a project ID
- Update your app.json automatically

## Step 4: Update Configuration (3 minutes)

### Update app.json

The project ID should be auto-filled. If not, copy it from the EAS init output:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "abc123-your-actual-project-id"
      }
    }
  }
}
```

### Update eas.json (Optional - only needed for submission)

For now, you can skip this. Update later when ready to submit to stores.

See `CONFIGURATION_CHECKLIST.md` for detailed instructions.

## Step 5: Configure Credentials (2 minutes)

```bash
npm run eas:credentials
# or: eas credentials
```

Select your platform and follow the prompts. EAS can automatically generate credentials for you!

## Step 6: First Build (5 minutes to start, 10-20 minutes to complete)

### Development Build (Recommended for first build)

```bash
# Both platforms
npm run build:dev

# iOS only
npm run build:dev:ios

# Android only
npm run build:dev:android
```

### Preview Build (For testing)

```bash
npm run build:preview
# or specific platform: build:preview:ios or build:preview:android
```

### Production Build (For store submission)

```bash
npm run build:prod
# or specific platform: build:prod:ios or build:prod:android
```

## Step 7: Download and Test

Once the build completes:

1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project → Builds
3. Download the build file
4. Install on your device:
   - **iOS Development**: Use Expo Go or development build
   - **iOS Preview/Production**: Use TestFlight
   - **Android**: Download APK/AAB and install directly

## Quick Command Reference

### EAS Setup Commands

```bash
npm run eas:login           # Login to Expo
npm run eas:init            # Initialize EAS project
npm run eas:credentials     # Manage credentials
```

### Build Commands

```bash
# Development builds (with dev client)
npm run build:dev           # All platforms
npm run build:dev:ios       # iOS only
npm run build:dev:android   # Android only

# Preview builds (for testing)
npm run build:preview       # All platforms
npm run build:preview:ios   # iOS only
npm run build:preview:android # Android only

# Production builds (for stores)
npm run build:prod          # All platforms
npm run build:prod:ios      # iOS only
npm run build:prod:android  # Android only
```

### Submission Commands

```bash
npm run submit:ios          # Submit to App Store
npm run submit:android      # Submit to Google Play
```

### OTA Update Commands

```bash
npm run update:dev          # Push update to development
npm run update:preview      # Push update to preview
npm run update:prod         # Push update to production
```

## That's It!

You now have:
- ✅ EAS configured
- ✅ Credentials set up
- ✅ First build created
- ✅ Ready to test

## Next Steps

### For Development

1. Install the development build on your device
2. Run `npm start` to start Metro bundler
3. Connect to your development build
4. Start coding!

### For Testing

1. Build with preview profile
2. Distribute to testers via TestFlight (iOS) or direct download (Android)
3. Gather feedback
4. Iterate!

### For Production

1. Complete full configuration (see `CONFIGURATION_CHECKLIST.md`)
2. Set up Firebase for push notifications
3. Configure deep linking domains
4. Build with production profile
5. Submit to stores

## Troubleshooting

### "eas command not found"

```bash
npm install -g eas-cli
```

### "Not logged in"

```bash
npm run eas:login
```

### "Project not configured"

```bash
npm run eas:init
```

### Build failed

1. Check build logs in EAS dashboard
2. Look for error messages
3. Most common issues:
   - Missing credentials → Run `eas credentials`
   - Package conflicts → Check dependencies
   - Configuration errors → Verify app.json and eas.json

### Need help?

- Review `EAS_SETUP.md` for detailed instructions
- Check `CONFIGURATION_CHECKLIST.md` for all required settings
- Visit [Expo Forums](https://forums.expo.dev)
- Join [Expo Discord](https://chat.expo.dev)

## Advanced Features

Once you're comfortable with the basics, explore:

### Push Notifications

The notification service is already set up! Just need to:
1. Configure Firebase (see `EAS_SETUP.md`)
2. Implement backend endpoints
3. Test on physical device

### Deep Linking

The deep linking service is ready to go:
1. Set up web domains (see `EAS_SETUP.md`)
2. Host `.well-known` files
3. Test with your URL scheme

### OTA Updates

Push JavaScript updates without rebuilding:
```bash
npm run update:prod
```

Users get updates automatically on next app launch!

## Complete Documentation

- **EAS_SETUP.md** - Comprehensive setup guide with all details
- **CONFIGURATION_CHECKLIST.md** - All configuration values you need to update
- **EAS_FILES_SUMMARY.md** - Overview of all files created
- **QUICK_START.md** - This file!

## Pro Tips

1. **Start with development builds** - They're faster and include dev tools
2. **Use preview builds for testing** - Share with team before production
3. **Set up CI/CD** - Automate builds with GitHub Actions or similar
4. **Use EAS Secrets** - For sensitive environment variables
5. **Enable auto-increment** - Already configured for production builds
6. **Test on real devices** - Simulators don't support push notifications

## Common Workflows

### Daily Development

```bash
# Terminal 1: Start Metro
npm start

# Terminal 2: When you need a new build
npm run build:dev:ios
```

### Release Testing

```bash
# Build preview version
npm run build:preview

# Share with testers via TestFlight/direct download
```

### Production Release

```bash
# Build production version
npm run build:prod

# Submit to stores
npm run submit:ios
npm run submit:android
```

### Hotfix

```bash
# Make your fixes
# Then push OTA update (if JavaScript-only changes)
npm run update:prod

# Or rebuild if native changes
npm run build:prod
```

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)

## Need More Details?

Check out the comprehensive guides:
- For complete setup instructions → `EAS_SETUP.md`
- For configuration values → `CONFIGURATION_CHECKLIST.md`
- For file overview → `EAS_FILES_SUMMARY.md`

---

**Happy Building!** 🚀
