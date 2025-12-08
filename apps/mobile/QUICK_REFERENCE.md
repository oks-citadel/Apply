# JobPilot Mobile - Quick Reference Card

## Essential Commands

```bash
# Setup
npm install                    # Install dependencies
cp .env.example .env          # Create environment file
cd ios && pod install && cd .. # Install iOS dependencies (macOS)

# Run
npm start                      # Start Metro bundler
npm run ios                    # Run on iOS
npm run android                # Run on Android

# Development
npm test                       # Run tests
npm run lint                   # Lint code
npm run type-check            # Check TypeScript

# Troubleshooting
npm start -- --reset-cache    # Clear Metro cache
watchman watch-del-all        # Clear watchman cache
```

## Project Structure

```
src/
├── components/common/    # UI components
├── screens/             # App screens
│   ├── auth/           # Login, Register
│   ├── dashboard/      # Dashboard
│   ├── jobs/           # Job list
│   └── applications/   # Applications
├── navigation/         # Navigation setup
├── services/           # API client
├── store/              # State management
├── theme/              # Styling
├── types/              # TypeScript types
└── utils/              # Helpers
```

## Import Aliases

```typescript
import { Button } from '@components/common';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { useAuthStore } from '@store/authStore';
import { authApi } from '@services/api';
import { theme } from '@theme';
import type { User } from '@types';
import { validators } from '@utils';
```

## Common Components

### Button
```typescript
<Button
  title="Click me"
  variant="primary"      // primary|secondary|outline|ghost
  size="md"             // sm|md|lg
  loading={false}
  onPress={() => {}}
  fullWidth
/>
```

### Input
```typescript
<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={error}
  placeholder="Enter email"
  required
  secureTextEntry      // For passwords
/>
```

### Card
```typescript
<Card elevation="md" onPress={() => {}}>
  {children}
</Card>
```

## State Management

### Auth Store (Zustand)
```typescript
const {
  user,
  isAuthenticated,
  login,
  logout,
  isLoading
} = useAuthStore();

// Login
await login(email, password);

// Logout
await logout();
```

### Server State (React Query)
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => jobsApi.getJobs(),
});
```

## API Usage

```typescript
// Auth
await authApi.login({ email, password });
await authApi.register(data);
await authApi.logout(refreshToken);

// Jobs
await jobsApi.getJobs({ page, limit, search });
await jobsApi.getJobById(id);
await jobsApi.saveJob(jobId);

// Applications
await applicationsApi.getApplications({ status });
await applicationsApi.createApplication(data);
await applicationsApi.withdrawApplication(id);
```

## Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

// Navigate to screen
navigation.navigate('Jobs');

// Go back
navigation.goBack();

// Navigate with params
navigation.navigate('JobDetails', { jobId: '123' });
```

## Theme Usage

```typescript
import { theme } from '@theme';

// Colors
theme.colors.primary[600]
theme.colors.gray[900]
theme.colors.error.main

// Spacing
theme.spacing.md      // 16
theme.spacing.lg      // 24

// Typography
theme.fontSize.md     // 16
theme.fontWeight.bold // '700'

// Shadows
theme.shadows.md
```

## Environment Variables

```env
API_URL=http://localhost:3000/api       # iOS Simulator
API_URL=http://10.0.2.2:3000/api       # Android Emulator
API_URL=http://192.168.x.x:3000/api    # Physical device
```

## TypeScript Types

```typescript
import type {
  User,
  Job,
  Application,
  ApplicationStatus,
  PaginatedResponse,
} from '@types';
```

## Common Patterns

### Loading State
```typescript
if (isLoading) {
  return <LoadingSpinner fullScreen />;
}
```

### Error Handling
```typescript
try {
  await someAction();
} catch (error: any) {
  Alert.alert('Error', error.response?.data?.message);
}
```

### Pull to Refresh
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};

<FlatList
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
/>
```

### Infinite Scroll
```typescript
<FlatList
  data={items}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isFetching ? <LoadingSpinner /> : null}
/>
```

## Testing

```typescript
// Component test
import { render } from '@testing-library/react-native';

test('renders button', () => {
  const { getByText } = render(<Button title="Click" />);
  expect(getByText('Click')).toBeTruthy();
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Metro won't start | `npm start -- --reset-cache` |
| iOS build fails | `cd ios && pod install && cd ..` |
| Android build fails | `cd android && ./gradlew clean` |
| Can't connect to API | Check API_URL in .env |
| Module not found | `rm -rf node_modules && npm install` |

## Documentation Files

- **QUICKSTART.md** - Get started in 5 minutes
- **SETUP.md** - Detailed setup instructions
- **README.md** - Project overview
- **INDEX.md** - Complete reference
- **IMPLEMENTATION_SUMMARY.md** - What's implemented
- **PROJECT_STRUCTURE.md** - Code organization

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component |
| `src/navigation/AppNavigator.tsx` | Navigation |
| `src/services/api.ts` | API client |
| `src/store/authStore.ts` | Auth state |
| `src/theme/index.ts` | Theme system |
| `src/types/index.ts` | Type definitions |

## Screen Files

- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/RegisterScreen.tsx`
- `src/screens/dashboard/DashboardScreen.tsx`
- `src/screens/jobs/JobListScreen.tsx`
- `src/screens/applications/ApplicationsScreen.tsx`

## Useful Links

- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand)

---

**Keep this card handy for quick reference during development!**
