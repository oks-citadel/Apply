export interface OAuthError {
  code: string;
  message: string;
  provider?: string;
}

export class OAuthErrorHandler {
  static readonly ERROR_CODES = {
    ACCESS_DENIED: 'access_denied',
    INVALID_REQUEST: 'invalid_request',
    UNAUTHORIZED_CLIENT: 'unauthorized_client',
    UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
    INVALID_SCOPE: 'invalid_scope',
    SERVER_ERROR: 'server_error',
    TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
    EMAIL_NOT_PROVIDED: 'email_not_provided',
    ACCOUNT_EXISTS: 'account_exists',
    NETWORK_ERROR: 'network_error',
  };

  static readonly ERROR_MESSAGES: Record<string, string> = {
    [this.ERROR_CODES.ACCESS_DENIED]:
      'Access was denied. Please try again and grant the necessary permissions.',
    [this.ERROR_CODES.INVALID_REQUEST]:
      'The authentication request was invalid. Please try again.',
    [this.ERROR_CODES.UNAUTHORIZED_CLIENT]:
      'The application is not authorized. Please contact support.',
    [this.ERROR_CODES.UNSUPPORTED_RESPONSE_TYPE]:
      'Authentication method not supported. Please contact support.',
    [this.ERROR_CODES.INVALID_SCOPE]:
      'Invalid permissions requested. Please contact support.',
    [this.ERROR_CODES.SERVER_ERROR]:
      'Authentication server error. Please try again later.',
    [this.ERROR_CODES.TEMPORARILY_UNAVAILABLE]:
      'Authentication service is temporarily unavailable. Please try again later.',
    [this.ERROR_CODES.EMAIL_NOT_PROVIDED]:
      'Email address is required but was not provided by the authentication provider.',
    [this.ERROR_CODES.ACCOUNT_EXISTS]:
      'An account with this email already exists. Please sign in with your existing method.',
    [this.ERROR_CODES.NETWORK_ERROR]:
      'Network error occurred. Please check your connection and try again.',
  };

  static parseError(error: string | Error | unknown): OAuthError {
    let code = this.ERROR_CODES.SERVER_ERROR;
    let message = 'An unexpected error occurred during authentication.';

    if (typeof error === 'string') {
      code = error;
      message = this.ERROR_MESSAGES[error] || message;
    } else if (error instanceof Error) {
      message = error.message;
      // Try to extract error code from message
      const errorCode = Object.keys(this.ERROR_CODES).find((key) =>
        error.message.toLowerCase().includes(key.toLowerCase())
      );
      if (errorCode) {
        code = this.ERROR_CODES[errorCode as keyof typeof this.ERROR_CODES];
      }
    }

    return { code, message };
  }

  static getUserFriendlyMessage(error: string | Error | unknown, provider?: string): string {
    const parsedError = this.parseError(error);
    const providerName = provider
      ? provider.charAt(0).toUpperCase() + provider.slice(1)
      : 'the provider';

    switch (parsedError.code) {
      case this.ERROR_CODES.ACCESS_DENIED:
        return `You denied access to ${providerName}. To sign in with ${providerName}, you need to grant the required permissions.`;
      case this.ERROR_CODES.EMAIL_NOT_PROVIDED:
        return `${providerName} did not provide your email address. Please ensure your ${providerName} account has a verified email address.`;
      case this.ERROR_CODES.ACCOUNT_EXISTS:
        return `An account with this email already exists. Please sign in using your original sign-up method.`;
      case this.ERROR_CODES.NETWORK_ERROR:
        return 'Unable to connect to the authentication service. Please check your internet connection and try again.';
      default:
        return parsedError.message;
    }
  }

  static isRetryable(error: string | Error | unknown): boolean {
    const parsedError = this.parseError(error);
    const retryableErrors = [
      this.ERROR_CODES.SERVER_ERROR,
      this.ERROR_CODES.TEMPORARILY_UNAVAILABLE,
      this.ERROR_CODES.NETWORK_ERROR,
    ];
    return retryableErrors.includes(parsedError.code);
  }

  static shouldShowContactSupport(error: string | Error | unknown): boolean {
    const parsedError = this.parseError(error);
    const supportErrors = [
      this.ERROR_CODES.UNAUTHORIZED_CLIENT,
      this.ERROR_CODES.UNSUPPORTED_RESPONSE_TYPE,
      this.ERROR_CODES.INVALID_SCOPE,
    ];
    return supportErrors.includes(parsedError.code);
  }
}

export function buildOAuthUrl(
  provider: 'google' | 'linkedin' | 'github',
  apiUrl: string
): string {
  return `${apiUrl}/auth/${provider}`;
}

export function extractTokensFromUrl(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  const urlParams = new URLSearchParams(url.split('?')[1] || '');

  return {
    accessToken: urlParams.get('access_token'),
    refreshToken: urlParams.get('refresh_token'),
    error: urlParams.get('error'),
    errorDescription: urlParams.get('error_description'),
  };
}

export function clearOAuthSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('oauth_redirect');
    sessionStorage.removeItem('oauth_provider');
    sessionStorage.removeItem('oauth_state');
  }
}
