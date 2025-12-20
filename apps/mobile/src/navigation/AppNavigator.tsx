import React, { useEffect, useRef } from 'react';
import { Text, Linking } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { JobListScreen } from '../screens/jobs/JobListScreen';
import { JobDetailsScreen } from '../screens/jobs/JobDetailsScreen';
import { ApplicationsScreen } from '../screens/applications/ApplicationsScreen';
import { ApplicationDetailsScreen } from '../screens/applications/ApplicationDetailsScreen';
import { theme } from '../theme';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  JobsStackParamList,
  ApplicationsStackParamList,
} from './types';
import { deepLinkingService, ParsedDeepLink } from '../services/deepLinking';
import { notificationService } from '../services/notifications';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const JobsStack = createNativeStackNavigator<JobsStackParamList>();
const ApplicationsStack = createNativeStackNavigator<ApplicationsStackParamList>();

// Jobs Stack Navigator
const JobsNavigator = () => {
  return (
    <JobsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.white,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.gray[900],
        },
        headerTintColor: theme.colors.gray[900],
        animation: 'slide_from_right',
      }}
    >
      <JobsStack.Screen
        name="JobsList"
        component={JobListScreen}
        options={{ headerShown: false }}
      />
      <JobsStack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ title: 'Job Details' }}
      />
    </JobsStack.Navigator>
  );
};

// Applications Stack Navigator
const ApplicationsNavigator = () => {
  return (
    <ApplicationsStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.white,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.gray[900],
        },
        headerTintColor: theme.colors.gray[900],
        animation: 'slide_from_right',
      }}
    >
      <ApplicationsStack.Screen
        name="ApplicationsList"
        component={ApplicationsScreen}
        options={{ headerShown: false }}
      />
      <ApplicationsStack.Screen
        name="ApplicationDetails"
        component={ApplicationDetailsScreen}
        options={{ title: 'Application Details' }}
      />
    </ApplicationsStack.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={LoginScreen as any}
        options={{ title: 'Forgot Password', headerShown: true }}
      />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.gray[500],
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray[200],
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.gray[200],
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.gray[900],
        },
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="🏠" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Jobs"
        component={JobsNavigator}
        options={{
          title: 'Jobs',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="💼" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Applications"
        component={ApplicationsNavigator}
        options={{
          title: 'My Applications',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="📝" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={DashboardScreen as any}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="👤" color={color} size={size} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};

// Custom Tab Bar Icon Component
const TabBarIcon = ({
  icon,
  color,
  size,
}: {
  icon: string;
  color: string;
  size: number;
}) => {
  return <Text style={{ fontSize: size, color }}>{icon}</Text>;
};

// Root Navigator
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, loadAuthState } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize notification service
      await notificationService.initialize();

      // Initialize deep linking service
      await deepLinkingService.initialize(handleDeepLink);

      // Handle initial URL if app was opened via deep link
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial URL:', initialUrl);
        const parsedLink = deepLinkingService.parseDeepLink(initialUrl);
        if (parsedLink) {
          // Wait for navigation to be ready
          setTimeout(() => {
            handleDeepLink(parsedLink);
          }, 1000);
        }
      }
    };

    initializeServices();

    // Cleanup
    return () => {
      notificationService.cleanup();
    };
  }, []);

  // Handle deep link navigation
  const handleDeepLink = (link: ParsedDeepLink) => {
    if (!navigationRef.current || !isAuthenticated) {
      return;
    }

    console.log('Handling deep link:', link);

    try {
      // Parse route and navigate accordingly
      const { route, params, queryParams } = link;

      // Job routes
      if (route.startsWith('jobs/')) {
        const jobId = params.jobId || route.split('/')[1];
        if (jobId) {
          // Navigate to job details
          console.log('Navigate to job:', jobId);
          navigationRef.current.navigate('Main', {
            screen: 'Jobs',
            params: { screen: 'JobDetails', params: { jobId } },
          } as any);
        }
      }
      // Application routes
      else if (route.startsWith('applications/')) {
        const applicationId = params.applicationId || route.split('/')[1];
        if (applicationId) {
          // Navigate to application details
          console.log('Navigate to application:', applicationId);
          navigationRef.current.navigate('Main', {
            screen: 'Applications',
            params: { screen: 'ApplicationDetails', params: { applicationId } },
          } as any);
        }
      }
      // Dashboard
      else if (route === 'dashboard') {
        navigationRef.current.navigate('Main');
      }
      // Profile routes
      else if (route.startsWith('profile')) {
        navigationRef.current.navigate('Main');
        // Add profile navigation when ProfileScreen is implemented
      }
      // Auth routes (only if not authenticated)
      else if (!isAuthenticated) {
        if (route === 'auth/login') {
          navigationRef.current.navigate('Auth');
        } else if (route === 'auth/register') {
          navigationRef.current.navigate('Auth');
        } else if (route === 'auth/reset-password') {
          const token = queryParams.token;
          if (token) {
            console.log('Navigate to reset password with token:', token);
          }
        } else if (route === 'auth/verify-email') {
          const token = queryParams.token;
          if (token) {
            console.log('Navigate to verify email with token:', token);
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  // Get linking configuration
  const linking = deepLinkingService.getLinkingConfig();

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      fallback={<LoadingSpinner fullScreen text="Loading..." />}
      onReady={() => {
        console.log('Navigation ready');
      }}
      onStateChange={(state) => {
        console.log('Navigation state changed:', state);
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
