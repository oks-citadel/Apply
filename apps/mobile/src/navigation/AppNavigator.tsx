import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { LoadingSpinner } from '../components/common';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { JobListScreen } from '../screens/jobs/JobListScreen';
import { ApplicationsScreen } from '../screens/applications/ApplicationsScreen';
import { theme } from '../theme';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

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
        component={LoginScreen}
        options={{ title: 'Create Account' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={LoginScreen}
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
        component={JobListScreen}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="💼" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          title: 'My Applications',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon="📝" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={DashboardScreen}
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
  return <span style={{ fontSize: size }}>{icon}</span>;
};

// Root Navigator
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, loadAuthState } = useAuthStore();

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <NavigationContainer>
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
