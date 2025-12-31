import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from './api';

// Ensure browser session is completed properly for OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth Provider types supported by the auth-service
 */
export type OAuthProvider = 'google' | 'linkedin' | 'github';

/**
 * OAuth configuration for different providers
 */
interface OAuthConfig {
  authUrl: string;
  redirectUri: string;
}

/**
 * OAuth response structure from auth-service callback
 */
interface OAuthCallbackResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * Storage keys for OAuth session
 */
const OAUTH_STORAGE_KEYS = {
  PROVIDER: '@applyforus/oauth_provider',
  STATE: '@applyforus/oauth_state',
};

// API URL - matches the auth-service endpoint
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_URL) ||
  'http://localhost:3001';

// App scheme for deep linking callback
const APP_SCHEME = 'applyforus';

/**
 * Generate a cryptographically random state parameter for OAuth security
 */
const generateState = (): string => {
  const array = new Uint8Array(32);
  // Use crypto API if available, otherwise fall back to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * OAuth Service for handling OAuth authentication flows in the mobile app
 */
export class OAuthService {
  private static instance: OAuthService;

  private constructor() {}

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Get the redirect URI for OAuth callbacks
   * For mobile, we use the app's custom scheme
   */
  private getRedirectUri(): string {
    return `${APP_SCHEME}://oauth/callback`;
  }

  /**
   * Get the OAuth configuration for a specific provider
   */
  private getOAuthConfig(provider: OAuthProvider): OAuthConfig {
    const redirectUri = this.getRedirectUri();

    // The auth-service handles OAuth initiation
    // We need to open the browser to the auth endpoint with mobile redirect
    return {
      authUrl: `${API_BASE_URL}/auth/${provider}`,
      redirectUri,
    };
  }

  /**
   * Store OAuth session data before initiating the flow
   */
  private async storeOAuthSession(provider: OAuthProvider, state: string): Promise<void> {
    await AsyncStorage.multiSet([
      [OAUTH_STORAGE_KEYS.PROVIDER, provider],
      [OAUTH_STORAGE_KEYS.STATE, state],
    ]);
  }

  /**
   * Clear OAuth session data
   */
  public async clearOAuthSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      OAUTH_STORAGE_KEYS.PROVIDER,
      OAUTH_STORAGE_KEYS.STATE,
    ]);
  }

  /**
   * Get stored OAuth provider
   */
  public async getStoredProvider(): Promise<OAuthProvider | null> {
    const provider = await AsyncStorage.getItem(OAUTH_STORAGE_KEYS.PROVIDER);
    return provider as OAuthProvider | null;
  }

  /**
   * Get stored OAuth state
   */
  public async getStoredState(): Promise<string | null> {
    return AsyncStorage.getItem(OAUTH_STORAGE_KEYS.STATE);
  }

  /**
   * Initiate OAuth authentication flow for a specific provider
   * Opens the browser to the OAuth provider's login page
   */
  public async initiateOAuth(
    provider: OAuthProvider
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.getOAuthConfig(provider);
      const state = generateState();

      // Store session data for callback validation
      await this.storeOAuthSession(provider, state);

      // Build the auth URL with mobile-specific parameters
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.append('redirect_uri', config.redirectUri);
      authUrl.searchParams.append('state', state);
      authUrl.searchParams.append('platform', 'mobile');

      // Open the auth URL in an in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        config.redirectUri,
        {
          // Show share menu on iOS
          showInRecents: true,
          // Show title bar
          showTitle: true,
          // Enable bar collapsing on scroll
          enableBarCollapsing: true,
          // Toolbar color (primary brand color)
          toolbarColor: '#4F46E5',
          // Control bar color (iOS)
          controlsColor: '#FFFFFF',
        }
      );

      if (result.type === 'success' && result.url) {
        // Parse the callback URL
        const callbackResponse = this.parseCallbackUrl(result.url);

        if (callbackResponse.success) {
          // Clear the session before returning
          await this.clearOAuthSession();
          return { success: true };
        } else {
          await this.clearOAuthSession();
          return {
            success: false,
            error: callbackResponse.errorDescription || callbackResponse.error || 'OAuth authentication failed',
          };
        }
      } else if (result.type === 'cancel') {
        await this.clearOAuthSession();
        return { success: false, error: 'Authentication was cancelled' };
      } else {
        await this.clearOAuthSession();
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error: any) {
      await this.clearOAuthSession();
      console.error('OAuth error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during authentication',
      };
    }
  }

  /**
   * Initiate OAuth flow using the backend exchange token approach
   * This is an alternative approach where mobile gets an exchange token
   * from the backend after successful OAuth
   */
  public async initiateOAuthWithExchangeToken(
    provider: OAuthProvider
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> {
    try {
      const config = this.getOAuthConfig(provider);
      const state = generateState();

      // Store session data for callback validation
      await this.storeOAuthSession(provider, state);

      // Build the auth URL for mobile platform
      // The backend will redirect back with tokens in the URL for mobile
      const authUrl = new URL(`${API_BASE_URL}/auth/${provider}/mobile`);
      authUrl.searchParams.append('redirect_uri', config.redirectUri);
      authUrl.searchParams.append('state', state);

      // Open the auth URL in an in-app browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        config.redirectUri,
        {
          showInRecents: true,
          showTitle: true,
          enableBarCollapsing: true,
          toolbarColor: '#4F46E5',
          controlsColor: '#FFFFFF',
        }
      );

      if (result.type === 'success' && result.url) {
        // Parse the callback URL to extract tokens
        const callbackResponse = this.parseCallbackUrl(result.url);

        // Validate state parameter
        const storedState = await this.getStoredState();
        const urlState = this.getUrlParameter(result.url, 'state');

        if (storedState && urlState && storedState !== urlState) {
          await this.clearOAuthSession();
          return { success: false, error: 'Invalid state parameter - possible CSRF attack' };
        }

        if (callbackResponse.success && callbackResponse.accessToken) {
          await this.clearOAuthSession();
          return {
            success: true,
            accessToken: callbackResponse.accessToken,
            refreshToken: callbackResponse.refreshToken,
          };
        } else {
          await this.clearOAuthSession();
          return {
            success: false,
            error: callbackResponse.errorDescription || callbackResponse.error || 'OAuth authentication failed',
          };
        }
      } else if (result.type === 'cancel') {
        await this.clearOAuthSession();
        return { success: false, error: 'Authentication was cancelled' };
      } else {
        await this.clearOAuthSession();
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error: any) {
      await this.clearOAuthSession();
      console.error('OAuth error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during authentication',
      };
    }
  }

  /**
   * Exchange OAuth authorization code for tokens via the backend API
   * This is used when the OAuth callback returns an authorization code
   */
  public async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    error?: string;
  }> {
    try {
      // Call the backend to exchange the code for tokens
      const response = await authApi.loginWithOAuth(provider, code);

      return {
        success: true,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error: any) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to exchange code for tokens',
      };
    }
  }

  /**
   * Parse the OAuth callback URL to extract response data
   */
  private parseCallbackUrl(url: string): OAuthCallbackResponse {
    try {
      const urlObj = new URL(url);

      // Check for success parameter
      const success = urlObj.searchParams.get('success') === 'true';

      // Check for error
      const error = urlObj.searchParams.get('error');
      const errorDescription = urlObj.searchParams.get('error_description');

      // Check for tokens (for mobile OAuth flow)
      const accessToken = urlObj.searchParams.get('access_token') || undefined;
      const refreshToken = urlObj.searchParams.get('refresh_token') || undefined;

      if (error) {
        return {
          success: false,
          error,
          errorDescription: errorDescription || undefined,
        };
      }

      return {
        success: success || !!accessToken,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error parsing callback URL:', error);
      return { success: false, error: 'Invalid callback URL' };
    }
  }

  /**
   * Get a specific parameter from a URL
   */
  private getUrlParameter(url: string, param: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(param);
    } catch {
      return null;
    }
  }

  /**
   * Get a user-friendly error message for OAuth errors
   */
  public getErrorMessage(error: string | undefined, provider?: OAuthProvider): string {
    if (!error) {
      return 'An unknown error occurred during authentication.';
    }

    const providerName = provider
      ? provider.charAt(0).toUpperCase() + provider.slice(1)
      : 'the provider';

    // Map common OAuth errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      access_denied: `You declined to authorize ${providerName}. Please try again if you want to continue.`,
      invalid_request: 'The authentication request was invalid. Please try again.',
      invalid_scope: 'The requested permissions are not available.',
      server_error: `${providerName} is experiencing issues. Please try again later.`,
      temporarily_unavailable: `${providerName} is temporarily unavailable. Please try again later.`,
      login_required: `You need to log in to ${providerName} first.`,
      consent_required: `You need to consent to the required permissions in ${providerName}.`,
      interaction_required: 'Additional interaction is required. Please try again.',
      account_selection_required: 'Please select an account to continue.',
      invalid_token: 'The authentication token was invalid. Please try again.',
      expired_token: 'The authentication session has expired. Please try again.',
    };

    return errorMessages[error] || `Authentication with ${providerName} failed: ${error}`;
  }
}

// Export singleton instance
export const oauthService = OAuthService.getInstance();

/**
 * React hook for OAuth authentication
 */
export const useOAuth = () => {
  return {
    initiateOAuth: (provider: OAuthProvider) => oauthService.initiateOAuth(provider),
    initiateOAuthWithExchangeToken: (provider: OAuthProvider) =>
      oauthService.initiateOAuthWithExchangeToken(provider),
    exchangeCodeForTokens: (provider: OAuthProvider, code: string) =>
      oauthService.exchangeCodeForTokens(provider, code),
    getErrorMessage: (error: string | undefined, provider?: OAuthProvider) =>
      oauthService.getErrorMessage(error, provider),
    clearOAuthSession: () => oauthService.clearOAuthSession(),
  };
};
