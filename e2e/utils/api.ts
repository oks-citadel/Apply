/**
 * API utility functions for E2E tests
 * Provides helper methods for making API calls during testing
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data?: T;
  error?: string;
  headers: Headers;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  token?: string;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  method: string,
  endpoint: string,
  options: {
    data?: any;
    headers?: Record<string, string>;
    token?: string;
    baseUrl?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const baseUrl = options.baseUrl || process.env.TEST_API_URL || 'http://localhost:3001/api/v1';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: options.data ? JSON.stringify(options.data) : undefined,
    });

    let data: T | undefined;
    let error: string | undefined;

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      if (response.ok) {
        data = jsonData;
      } else {
        error = jsonData.message || jsonData.error || response.statusText;
      }
    } else {
      const textData = await response.text();
      if (response.ok) {
        data = textData as any;
      } else {
        error = textData || response.statusText;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      error,
      headers: response.headers,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      headers: new Headers(),
    };
  }
}

/**
 * Make a GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: Omit<Parameters<typeof apiRequest>[2], 'data'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('GET', endpoint, options);
}

/**
 * Make a POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<Parameters<typeof apiRequest>[2], 'data'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('POST', endpoint, { ...options, data });
}

/**
 * Make a PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<Parameters<typeof apiRequest>[2], 'data'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PUT', endpoint, { ...options, data });
}

/**
 * Make a PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<Parameters<typeof apiRequest>[2], 'data'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('PATCH', endpoint, { ...options, data });
}

/**
 * Make a DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: Omit<Parameters<typeof apiRequest>[2], 'data'>
): Promise<ApiResponse<T>> {
  return apiRequest<T>('DELETE', endpoint, options);
}

/**
 * Authentication API helpers
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username?: string;
  }): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>> {
    return apiPost('/auth/register', userData);
  },

  /**
   * Login a user
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>> {
    return apiPost('/auth/login', credentials);
  },

  /**
   * Logout a user
   */
  async logout(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiPost('/auth/logout', {}, { token });
  },

  /**
   * Get current user profile
   */
  async getProfile(token: string): Promise<ApiResponse<any>> {
    return apiGet('/auth/me', { token });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    return apiPost('/auth/refresh', { refreshToken });
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiPost('/auth/verify-email', { token });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiPost('/auth/forgot-password', { email });
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return apiPost('/auth/reset-password', { token, newPassword });
  },
};

/**
 * User API helpers
 */
export const userApi = {
  /**
   * Get user by ID
   */
  async getUser(userId: string, token: string): Promise<ApiResponse<any>> {
    return apiGet(`/users/${userId}`, { token });
  },

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: any, token: string): Promise<ApiResponse<any>> {
    return apiPatch(`/users/${userId}`, data, { token });
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string, token: string): Promise<ApiResponse<void>> {
    return apiDelete(`/users/${userId}`, { token });
  },
};

/**
 * Wait for API to be ready
 */
export async function waitForApi(
  maxAttempts: number = 30,
  interval: number = 1000
): Promise<boolean> {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3001/api/v1';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
      });

      if (response.ok) {
        console.log(`API is ready (attempt ${attempt}/${maxAttempts})`);
        return true;
      }
    } catch (error) {
      console.log(`API not ready yet (attempt ${attempt}/${maxAttempts})`);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  console.error('API failed to become ready');
  return false;
}

/**
 * Create a test user and return credentials
 */
export async function createTestUser(overrides: Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}> = {}): Promise<{
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  user: any;
}> {
  const timestamp = Date.now();
  const userData = {
    email: overrides.email || `test${timestamp}@example.com`,
    password: overrides.password || 'TestPassword123!',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    username: overrides.username || `testuser${timestamp}`,
  };

  const response = await authApi.register(userData);

  if (!response.ok || !response.data) {
    throw new Error(`Failed to create test user: ${response.error || response.statusText}`);
  }

  return {
    email: userData.email,
    password: userData.password,
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: response.data.user,
  };
}

/**
 * Delete a test user by email
 */
export async function deleteTestUser(email: string, token: string): Promise<void> {
  // First get the user ID
  const profileResponse = await authApi.getProfile(token);

  if (profileResponse.ok && profileResponse.data) {
    const userId = profileResponse.data.id;
    await userApi.deleteUser(userId, token);
  }
}

/**
 * Assert API response status
 */
export function assertApiStatus(
  response: ApiResponse,
  expectedStatus: number,
  message?: string
): void {
  if (response.status !== expectedStatus) {
    const errorMsg = message ||
      `Expected status ${expectedStatus}, but got ${response.status}: ${response.error || response.statusText}`;
    throw new Error(errorMsg);
  }
}

/**
 * Assert API response is successful
 */
export function assertApiSuccess(response: ApiResponse, message?: string): void {
  if (!response.ok) {
    const errorMsg = message ||
      `Expected successful response, but got ${response.status}: ${response.error || response.statusText}`;
    throw new Error(errorMsg);
  }
}

/**
 * Assert API response has data
 */
export function assertApiData<T>(
  response: ApiResponse<T>,
  message?: string
): asserts response is ApiResponse<T> & { data: T } {
  if (!response.data) {
    const errorMsg = message || 'Expected response to have data, but it was undefined';
    throw new Error(errorMsg);
  }
}
