import React from 'react';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for initial URL
const INITIAL_URL_KEY = '@applyforus_initial_url';

/**
 * Deep link route mapping
 */
export const DeepLinkRoutes = {
  // Job routes
  JOB_LIST: 'jobs',
  JOB_DETAILS: 'jobs/:jobId',

  // Application routes
  APPLICATION_LIST: 'applications',
  APPLICATION_DETAILS: 'applications/:applicationId',

  // Profile routes
  PROFILE: 'profile',
  EDIT_PROFILE: 'profile/edit',
  SETTINGS: 'settings',

  // Auth routes
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',
  RESET_PASSWORD: 'auth/reset-password',
  VERIFY_EMAIL: 'auth/verify-email',

  // Other routes
  DASHBOARD: 'dashboard',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Universal link configuration
 */
export const UniversalLinks = {
  production: 'https://jobpilot.app',
  preview: 'https://preview.jobpilot.app',
  development: 'https://dev.jobpilot.app',
} as const;

/**
 * Deep link URL schemes
 */
export const DeepLinkSchemes = {
  app: 'applyforus',
  https: 'https',
  http: 'http',
} as const;

/**
 * Parse deep link URL into route and parameters
 */
export interface ParsedDeepLink {
  route: string;
  params: Record<string, string>;
  queryParams: Record<string, string>;
}

export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private initialUrl: string | null = null;
  private navigationCallback?: (link: ParsedDeepLink) => void;

  private constructor() {}

  public static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  /**
   * Initialize deep linking service
   */
  public async initialize(
    navigationCallback?: (link: ParsedDeepLink) => void
  ): Promise<() => void> {
    this.navigationCallback = navigationCallback;

    // Get initial URL if app was opened via deep link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.initialUrl = initialUrl;
      await AsyncStorage.setItem(INITIAL_URL_KEY, initialUrl);
    }

    // Listen for deep link events while app is running
    const subscription = Linking.addEventListener('url', this.handleDeepLink);

    // Return cleanup function
    return () => {
      subscription.remove();
    };
  }

  /**
   * Get initial URL that opened the app
   */
  public getInitialUrl(): string | null {
    return this.initialUrl;
  }

  /**
   * Handle incoming deep link
   */
  private handleDeepLink = (event: { url: string }): void => {
    console.log('Deep link received:', event.url);
    const parsedLink = this.parseDeepLink(event.url);

    if (parsedLink && this.navigationCallback) {
      this.navigationCallback(parsedLink);
    }
  };

  /**
   * Parse deep link URL into route and parameters
   */
  public parseDeepLink(url: string): ParsedDeepLink | null {
    try {
      const urlObj = new URL(url);

      // Extract path and remove leading slash
      let path = urlObj.pathname.replace(/^\//, '');

      // For app scheme URLs, the host is part of the path
      if (urlObj.protocol === `${DeepLinkSchemes.app}:`) {
        path = urlObj.host + (path ? `/${path}` : '');
      }

      // Extract route parameters (e.g., /jobs/:jobId)
      const params = this.extractRouteParams(path);

      // Extract query parameters
      const queryParams: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      return {
        route: path,
        params,
        queryParams,
      };
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Extract route parameters from path
   */
  private extractRouteParams(path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const segments = path.split('/');

    // Match against known routes
    const routes = Object.values(DeepLinkRoutes);

    for (const route of routes) {
      const routeSegments = route.split('/');

      if (routeSegments.length !== segments.length) {
        continue;
      }

      let isMatch = true;
      const tempParams: Record<string, string> = {};

      for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];
        const pathSegment = segments[i];

        if (routeSegment.startsWith(':')) {
          // Parameter segment
          const paramName = routeSegment.slice(1);
          tempParams[paramName] = pathSegment;
        } else if (routeSegment !== pathSegment) {
          // Static segment doesn't match
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        Object.assign(params, tempParams);
        break;
      }
    }

    return params;
  }

  /**
   * Build deep link URL from route and parameters
   */
  public buildDeepLink(
    route: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>,
    useUniversalLink = false
  ): string {
    let path = route;

    // Replace route parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value);
      });
    }

    // Build query string
    let queryString = '';
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams(queryParams);
      queryString = `?${searchParams.toString()}`;
    }

    // Build full URL
    if (useUniversalLink) {
      const env = process.env.APP_ENV || 'development';
      const baseUrl = UniversalLinks[env as keyof typeof UniversalLinks];
      return `${baseUrl}/${path}${queryString}`;
    } else {
      return `${DeepLinkSchemes.app}://${path}${queryString}`;
    }
  }

  /**
   * Open deep link URL
   */
  public async openDeepLink(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening deep link:', error);
    }
  }

  /**
   * Open external URL in browser
   */
  public async openExternalUrl(url: string): Promise<void> {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#4F46E5',
        controlsColor: '#FFFFFF',
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch (error) {
      console.error('Error opening external URL:', error);
    }
  }

  /**
   * Share deep link
   */
  public async shareDeepLink(
    route: string,
    params?: Record<string, string>,
    message?: string
  ): Promise<void> {
    try {
      const { Share } = await import('react-native');
      const url = this.buildDeepLink(route, params, undefined, true);

      await Share.share({
        message: message || url,
        url: Platform.OS === 'ios' ? url : undefined,
      });
    } catch (error) {
      console.error('Error sharing deep link:', error);
    }
  }

  /**
   * Navigate to job details screen
   */
  public buildJobDetailsLink(jobId: string): string {
    return this.buildDeepLink(DeepLinkRoutes.JOB_DETAILS, { jobId });
  }

  /**
   * Navigate to application details screen
   */
  public buildApplicationDetailsLink(applicationId: string): string {
    return this.buildDeepLink(DeepLinkRoutes.APPLICATION_DETAILS, {
      applicationId,
    });
  }

  /**
   * Navigate to email verification screen
   */
  public buildVerifyEmailLink(token: string): string {
    return this.buildDeepLink(
      DeepLinkRoutes.VERIFY_EMAIL,
      undefined,
      { token }
    );
  }

  /**
   * Navigate to password reset screen
   */
  public buildResetPasswordLink(token: string): string {
    return this.buildDeepLink(
      DeepLinkRoutes.RESET_PASSWORD,
      undefined,
      { token }
    );
  }

  /**
   * Get linking configuration for React Navigation
   */
  public getLinkingConfig() {
    const config = {
      prefixes: [
        DeepLinkSchemes.app + '://',
        ...Object.values(UniversalLinks),
      ],
      config: {
        screens: {
          Auth: {
            screens: {
              Login: DeepLinkRoutes.LOGIN,
              Register: DeepLinkRoutes.REGISTER,
              ForgotPassword: DeepLinkRoutes.RESET_PASSWORD,
              VerifyEmail: {
                path: DeepLinkRoutes.VERIFY_EMAIL,
                parse: {
                  token: (token: string) => token,
                },
              },
            },
          },
          Main: {
            screens: {
              Dashboard: DeepLinkRoutes.DASHBOARD,
              Jobs: {
                screens: {
                  JobsList: DeepLinkRoutes.JOB_LIST,
                  JobDetails: {
                    path: DeepLinkRoutes.JOB_DETAILS,
                    parse: {
                      jobId: (jobId: string) => jobId,
                    },
                  },
                },
              },
              Applications: {
                screens: {
                  ApplicationsList: DeepLinkRoutes.APPLICATION_LIST,
                  ApplicationDetails: {
                    path: DeepLinkRoutes.APPLICATION_DETAILS,
                    parse: {
                      applicationId: (applicationId: string) => applicationId,
                    },
                  },
                },
              },
              Profile: {
                screens: {
                  ProfileHome: DeepLinkRoutes.PROFILE,
                  EditProfile: DeepLinkRoutes.EDIT_PROFILE,
                  Settings: DeepLinkRoutes.SETTINGS,
                },
              },
            },
          },
        },
      },
    };

    return config;
  }

  /**
   * Handle universal links (App Links / Universal Links)
   */
  public async handleUniversalLink(url: string): Promise<void> {
    const parsedLink = this.parseDeepLink(url);

    if (parsedLink && this.navigationCallback) {
      this.navigationCallback(parsedLink);
    }
  }

  /**
   * Verify if URL is a valid deep link for this app
   */
  public isValidDeepLink(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check if it's our app scheme
      if (urlObj.protocol === `${DeepLinkSchemes.app}:`) {
        return true;
      }

      // Check if it's one of our universal links
      const universalLinkDomains = Object.values(UniversalLinks).map(
        (link) => new URL(link).host
      );

      return universalLinkDomains.includes(urlObj.host);
    } catch {
      return false;
    }
  }

  /**
   * Get stored initial URL
   */
  public async getStoredInitialUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(INITIAL_URL_KEY);
    } catch (error) {
      console.error('Error getting stored initial URL:', error);
      return null;
    }
  }

  /**
   * Clear stored initial URL
   */
  public async clearStoredInitialUrl(): Promise<void> {
    try {
      await AsyncStorage.removeItem(INITIAL_URL_KEY);
    } catch (error) {
      console.error('Error clearing stored initial URL:', error);
    }
  }
}

// Export singleton instance
export const deepLinkingService = DeepLinkingService.getInstance();

/**
 * React hook for deep linking
 */
export const useDeepLinking = () => {
  const [initialUrl, setInitialUrl] = React.useState<string | null>(null);
  const [lastUrl, setLastUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get initial URL
    const getInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialUrl(url);
        setLastUrl(url);
      }
    };

    getInitialUrl();

    // Listen for URL events
    const subscription = Linking.addEventListener('url', (event) => {
      setLastUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const openUrl = async (url: string) => {
    await deepLinkingService.openDeepLink(url);
  };

  const openExternalUrl = async (url: string) => {
    await deepLinkingService.openExternalUrl(url);
  };

  const buildLink = (
    route: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string>
  ) => {
    return deepLinkingService.buildDeepLink(route, params, queryParams);
  };

  return {
    initialUrl,
    lastUrl,
    openUrl,
    openExternalUrl,
    buildLink,
  };
};

