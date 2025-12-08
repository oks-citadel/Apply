# JobPilot Mobile - Quick Start Guide

Get the JobPilot mobile app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- For iOS: macOS with Xcode installed
- For Android: Android Studio installed

## Quick Setup

### 1. Install Dependencies (2 min)

```bash
cd apps/mobile
npm install
```

### 2. Setup Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env` and update the API URL:

```env
API_URL=http://localhost:3000/api  # iOS Simulator
# or
API_URL=http://10.0.2.2:3000/api   # Android Emulator
```

### 3. iOS Setup (macOS only, 2 min)

```bash
cd ios
pod install
cd ..
```

### 4. Run the App (1 min)

**Start Metro Bundler:**

```bash
npm start
```

**In a new terminal, run:**

For iOS:
```bash
npm run ios
```

For Android:
```bash
npm run android
```

## What You'll See

1. **Login Screen**
   - Email/password form
   - Google and LinkedIn OAuth buttons
   - Link to registration

2. **After Login - Dashboard**
   - Stats cards (applications count)
   - Recent applications
   - Quick actions

3. **Bottom Navigation**
   - Dashboard
   - Jobs
   - Applications
   - Profile

## Test Credentials

Use your backend test credentials or create a new account through the registration screen.

## Common Issues

### Metro Bundler Won't Start

```bash
npm start -- --reset-cache
```

### iOS Build Fails

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Android Build Fails

```bash
cd android
./gradlew clean
cd ..
```

### Can't Connect to API

**iOS Simulator:**
- Use `http://localhost:3000/api`

**Android Emulator:**
- Use `http://10.0.2.2:3000/api` (not localhost)

**Physical Device:**
- Use your computer's local IP: `http://192.168.x.x:3000/api`
- Make sure device and computer are on same network

## Project Structure (Overview)

```
apps/mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── navigation/     # Navigation setup
│   ├── services/       # API services
│   ├── store/          # State management
│   └── theme/          # Styling
├── package.json        # Dependencies
└── .env                # Configuration
```

## Next Steps

1. Review the full documentation:
   - `README.md` - Overview
   - `SETUP.md` - Detailed setup
   - `IMPLEMENTATION_SUMMARY.md` - What's included

2. Start the backend API server

3. Test the authentication flow

4. Browse jobs and create applications

5. Customize the app for your needs

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Review `PROJECT_STRUCTURE.md` for code organization
- See `IMPLEMENTATION_SUMMARY.md` for what's implemented

## Scripts

```bash
npm start              # Start Metro bundler
npm run ios            # Run on iOS
npm run android        # Run on Android
npm test               # Run tests
npm run lint           # Lint code
npm run type-check     # Check TypeScript
```

---

**Ready to code!** The mobile app is fully set up and ready for development.
