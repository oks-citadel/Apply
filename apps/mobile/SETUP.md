# JobPilot Mobile App - Setup Guide

This guide will help you set up the React Native mobile application for the JobPilot AI Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

### General Requirements

- **Node.js** 18+ and npm or yarn
- **Git**
- **React Native CLI**: `npm install -g react-native-cli`
- **Watchman** (for macOS): `brew install watchman`

### iOS Development (macOS only)

- **Xcode** 14+ (from Mac App Store)
- **Xcode Command Line Tools**: `xcode-select --install`
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator** (included with Xcode)

### Android Development

- **Android Studio** (latest version)
- **Java JDK** 17+
- **Android SDK** (via Android Studio)
- **Android Emulator** or physical device

## Step-by-Step Setup

### 1. Install Dependencies

Navigate to the mobile app directory:

```bash
cd apps/mobile
```

Install Node.js dependencies:

```bash
npm install
# or
yarn install
```

### 2. iOS Setup (macOS only)

Install iOS dependencies:

```bash
cd ios
pod install
cd ..
```

If you encounter any issues, try:

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### 3. Android Setup

Open Android Studio and:

1. Open the `android` folder as a project
2. Wait for Gradle sync to complete
3. Install any missing SDK components when prompted
4. Create a virtual device (AVD) if needed

### 4. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
API_URL=http://YOUR_API_URL/api
GOOGLE_CLIENT_ID=your_google_client_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id
NODE_ENV=development
```

**Important Notes:**

- For iOS Simulator, use `http://localhost:3000/api` if running API locally
- For Android Emulator, use `http://10.0.2.2:3000/api` instead of `localhost`
- For physical devices, use your computer's local IP address

### 5. Running the Application

Start the Metro bundler:

```bash
npm start
# or
yarn start
```

In a new terminal, run the app:

**For iOS:**

```bash
npm run ios
# or to specify a device
npm run ios -- --simulator="iPhone 15 Pro"
```

**For Android:**

```bash
npm run android
```

## Project Structure

```
apps/mobile/
├── android/              # Android native code
├── ios/                  # iOS native code
├── src/
│   ├── components/       # Reusable UI components
│   │   └── common/       # Common components (Button, Input, etc.)
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── dashboard/    # Dashboard screens
│   │   ├── jobs/         # Job-related screens
│   │   └── applications/ # Application management screens
│   ├── services/         # API services and HTTP client
│   ├── store/            # Zustand state management
│   ├── theme/            # Theme and styling
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── App.tsx           # Root component
├── .env                  # Environment variables
├── app.json              # App configuration
├── babel.config.js       # Babel configuration
├── jest.config.js        # Jest configuration
├── metro.config.js       # Metro bundler configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Features Implemented

### Authentication

- Email/password login
- User registration
- OAuth integration setup (Google, LinkedIn)
- Token-based authentication
- Automatic token refresh
- Persistent authentication state

### Navigation

- Stack navigation for authentication flow
- Bottom tab navigation for main app
- Conditional navigation based on authentication state

### Screens

1. **Login Screen** (`src/screens/auth/LoginScreen.tsx`)
   - Email/password form
   - OAuth buttons
   - Form validation

2. **Register Screen** (`src/screens/auth/RegisterScreen.tsx`)
   - User registration form
   - Password confirmation
   - Validation

3. **Dashboard Screen** (`src/screens/dashboard/DashboardScreen.tsx`)
   - User welcome
   - Quick stats cards
   - Recent applications
   - Quick actions

4. **Job List Screen** (`src/screens/jobs/JobListScreen.tsx`)
   - Job search
   - Filters (employment type, location type)
   - Infinite scroll
   - Pull to refresh

5. **Applications Screen** (`src/screens/applications/ApplicationsScreen.tsx`)
   - Tab navigation by status
   - Application cards
   - Withdraw functionality

### State Management

- **Zustand** for authentication state
- **React Query** for server state management
- **AsyncStorage** for persistence

### API Integration

- Centralized Axios client
- Automatic JWT token injection
- Token refresh on 401 errors
- Error handling

## Development Workflow

### Running Tests

```bash
npm test
# or with coverage
npm test -- --coverage
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Clearing Cache

If you encounter issues, clear the cache:

```bash
# Clear Metro bundler cache
npm start -- --reset-cache

# Clear watchman cache
watchman watch-del-all
```

## Troubleshooting

### Metro Bundler Issues

```bash
# Kill any running Metro processes
killall -9 node

# Clear all caches
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### iOS Build Issues

```bash
# Clean Xcode build
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate
pod install
cd ..
```

### Android Build Issues

```bash
# Clean Gradle build
cd android
./gradlew clean
cd ..

# If still having issues, delete these folders:
rm -rf android/build
rm -rf android/app/build
```

### Common Errors

**Error: Unable to resolve module**

- Clear cache: `npm start -- --reset-cache`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Error: Command PhaseScriptExecution failed (iOS)**

- Clean build folder in Xcode
- Reinstall pods: `cd ios && pod install && cd ..`

**Error: SDK location not found (Android)**

- Create `local.properties` in `android/` folder
- Add: `sdk.dir=/Users/USERNAME/Library/Android/sdk` (update path accordingly)

## Next Steps

1. **Configure OAuth Providers**
   - Set up Google OAuth credentials
   - Set up LinkedIn OAuth credentials
   - Implement native OAuth flows

2. **Add More Features**
   - Job details screen
   - Application details screen
   - Profile management
   - Resume upload
   - Push notifications

3. **Testing**
   - Write unit tests for components
   - Write integration tests
   - Set up E2E testing with Detox

4. **Performance Optimization**
   - Implement image caching
   - Add code splitting
   - Optimize re-renders

5. **Deployment**
   - Set up CI/CD pipeline
   - Configure code signing (iOS)
   - Generate release builds
   - Submit to app stores

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
