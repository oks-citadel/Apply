# JobPilot Mobile App

React Native mobile application for the JobPilot AI Platform.

## Features

- User authentication (Email/Password + OAuth)
- Job search and browsing
- Application management
- Dashboard with statistics
- Real-time notifications
- Resume management

## Tech Stack

- **React Native** 0.73.x
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Query** for data fetching and caching
- **Zustand** for state management
- **Axios** for HTTP requests

## Prerequisites

- Node.js >= 18
- npm or yarn
- React Native development environment setup
  - For iOS: Xcode, CocoaPods
  - For Android: Android Studio, Java JDK

## Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Install iOS dependencies (macOS only):

```bash
cd ios && pod install && cd ..
```

3. Create environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your API URL and OAuth credentials.

## Running the App

### Development Mode

Start Metro bundler:

```bash
npm start
# or
yarn start
```

### iOS

```bash
npm run ios
# or
yarn ios
```

### Android

```bash
npm run android
# or
yarn android
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/       # Reusable components
│   │   └── common/       # Common UI components
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── dashboard/    # Dashboard screens
│   │   ├── jobs/         # Job-related screens
│   │   └── applications/ # Application screens
│   ├── services/         # API services
│   ├── store/            # State management (Zustand)
│   ├── theme/            # Theme configuration
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── App.tsx           # Root component
├── android/              # Android native code
├── ios/                  # iOS native code
├── index.js             # Entry point
├── app.json             # App configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Key Components

### Authentication

- Login screen with email/password
- OAuth integration (Google, LinkedIn)
- Token-based authentication with refresh
- Persistent authentication state

### Navigation

- Stack navigation for auth flow
- Bottom tab navigation for main app
- Conditional navigation based on auth state

### State Management

- **Zustand** for global state (auth, user)
- **React Query** for server state
- **AsyncStorage** for persistence

### API Integration

- Centralized API client with Axios
- Automatic token injection
- Token refresh on 401 errors
- Error handling

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
API_URL=http://localhost:3000/api
GOOGLE_CLIENT_ID=your_google_client_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id
NODE_ENV=development
```

## Building for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

### iOS

1. Open the project in Xcode:

```bash
open ios/JobPilot.xcworkspace
```

2. Select your development team
3. Archive the app (Product > Archive)
4. Distribute to App Store or export IPA

## Testing

```bash
npm test
# or
yarn test
```

## Code Quality

### Linting

```bash
npm run lint
# or
yarn lint
```

### Type Checking

```bash
npm run type-check
# or
yarn type-check
```

## Common Issues

### Metro Bundler Issues

```bash
# Clear cache
npm start -- --reset-cache
```

### iOS Build Issues

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Android Build Issues

```bash
# Clean build
cd android
./gradlew clean
cd ..
```

## API Documentation

The mobile app integrates with the JobPilot backend API. See the main project documentation for API endpoints and authentication details.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Copyright (c) 2024 JobPilot. All rights reserved.
