import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';
import { oauthService, OAuthProvider } from '../../services/oauth';

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const { login, loginWithOAuth, isLoading, error, clearError } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      await login(email, password);
      // Navigation will be handled automatically by AppNavigator based on auth state
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.message || 'Invalid email or password'
      );
    }
  };

  /**
   * Handle OAuth login for Google, LinkedIn, and GitHub
   * Uses expo-web-browser for in-app OAuth flow
   */
  const handleOAuthLogin = useCallback(
    async (provider: OAuthProvider) => {
      // Prevent multiple simultaneous OAuth attempts
      if (oauthLoading) {
        return;
      }

      try {
        clearError();
        setOauthLoading(provider);

        // Initiate OAuth flow with exchange token approach
        // This opens an in-app browser for the OAuth provider
        const result = await oauthService.initiateOAuthWithExchangeToken(provider);

        if (result.success && result.accessToken && result.refreshToken) {
          // Successfully received tokens, complete the login
          try {
            await loginWithOAuth(provider, result.accessToken);
            // Navigation will be handled automatically by AppNavigator based on auth state
          } catch (loginError: any) {
            console.error('OAuth login error:', loginError);
            Alert.alert(
              'Login Failed',
              loginError.response?.data?.message ||
                'Failed to complete authentication. Please try again.'
            );
          }
        } else if (!result.success) {
          // OAuth flow failed or was cancelled
          const errorMessage = oauthService.getErrorMessage(result.error, provider);

          // Only show alert if it wasn't a cancellation
          if (result.error !== 'Authentication was cancelled') {
            Alert.alert('Authentication Failed', errorMessage);
          }
        }
      } catch (err: any) {
        console.error('OAuth error:', err);
        const errorMessage = oauthService.getErrorMessage(err.message, provider);
        Alert.alert('OAuth Failed', errorMessage);
      } finally {
        setOauthLoading(null);
      }
    },
    [oauthLoading, clearError, loginWithOAuth]
  );

  /**
   * Handle OAuth login with fallback to code exchange
   * Alternative flow that uses authorization code
   */
  const handleOAuthLoginWithCodeExchange = useCallback(
    async (provider: OAuthProvider) => {
      if (oauthLoading) {
        return;
      }

      try {
        clearError();
        setOauthLoading(provider);

        // Initiate OAuth flow
        const result = await oauthService.initiateOAuth(provider);

        if (result.success) {
          // The OAuth flow completed successfully
          // Tokens should be set via cookies or will be returned by the callback
          Alert.alert(
            'Success',
            'Authentication successful! You will be logged in shortly.'
          );
        } else if (result.error && result.error !== 'Authentication was cancelled') {
          const errorMessage = oauthService.getErrorMessage(result.error, provider);
          Alert.alert('Authentication Failed', errorMessage);
        }
      } catch (err: any) {
        console.error('OAuth error:', err);
        const errorMessage = oauthService.getErrorMessage(err.message, provider);
        Alert.alert('OAuth Failed', errorMessage);
      } finally {
        setOauthLoading(null);
      }
    },
    [oauthLoading, clearError]
  );

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to JobPilot</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              required
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth Buttons with Loading States */}
            <TouchableOpacity
              style={[
                styles.oauthButtonContainer,
                (isLoading || oauthLoading) && styles.oauthButtonDisabled,
              ]}
              onPress={() => handleOAuthLogin('google')}
              disabled={isLoading || oauthLoading !== null}
              activeOpacity={0.7}
            >
              {oauthLoading === 'google' ? (
                <ActivityIndicator size="small" color={theme.colors.primary[600]} />
              ) : (
                <>
                  <View style={styles.oauthIconContainer}>
                    <Text style={styles.oauthIcon}>G</Text>
                  </View>
                  <Text style={styles.oauthButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oauthButtonContainer,
                (isLoading || oauthLoading) && styles.oauthButtonDisabled,
              ]}
              onPress={() => handleOAuthLogin('linkedin')}
              disabled={isLoading || oauthLoading !== null}
              activeOpacity={0.7}
            >
              {oauthLoading === 'linkedin' ? (
                <ActivityIndicator size="small" color={theme.colors.primary[600]} />
              ) : (
                <>
                  <View style={[styles.oauthIconContainer, styles.linkedinIcon]}>
                    <Text style={styles.oauthIconWhite}>in</Text>
                  </View>
                  <Text style={styles.oauthButtonText}>Continue with LinkedIn</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.oauthButtonContainer,
                (isLoading || oauthLoading) && styles.oauthButtonDisabled,
              ]}
              onPress={() => handleOAuthLogin('github')}
              disabled={isLoading || oauthLoading !== null}
              activeOpacity={0.7}
            >
              {oauthLoading === 'github' ? (
                <ActivityIndicator size="small" color={theme.colors.primary[600]} />
              ) : (
                <>
                  <View style={[styles.oauthIconContainer, styles.githubIcon]}>
                    <Text style={styles.oauthIconWhite}>GH</Text>
                  </View>
                  <Text style={styles.oauthButtonText}>Continue with GitHub</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[600],
  },
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.medium,
  },
  loginButton: {
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    fontWeight: theme.fontWeight.medium,
  },
  oauthButton: {
    marginBottom: theme.spacing.md,
  },
  oauthButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
    minHeight: 48,
  },
  oauthButtonDisabled: {
    opacity: 0.6,
  },
  oauthButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
    marginLeft: theme.spacing.sm,
  },
  oauthIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  oauthIcon: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[700],
  },
  oauthIconWhite: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  linkedinIcon: {
    backgroundColor: '#0A66C2',
  },
  githubIcon: {
    backgroundColor: '#24292F',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[600],
  },
  registerLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },
});
