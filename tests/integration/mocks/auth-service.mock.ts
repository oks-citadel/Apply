/**
 * Mock Auth Service
 * Provides mock responses for auth service endpoints
 */

import { AxiosInstance, AxiosResponse } from 'axios';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export class AuthServiceMock {
  private mockUsers: Map<string, any> = new Map();
  private mockTokens: Map<string, any> = new Map();

  constructor() {
    // Initialize with default mock data
    this.setupDefaultMocks();
  }

  private setupDefaultMocks(): void {
    // Add default test users
    this.mockUsers.set('test.user@jobpilot.test', {
      id: 'user-test-1',
      email: 'test.user@jobpilot.test',
      password: '$2b$10$hashedpassword', // hashed "Test@1234"
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    });
  }

  mockRegister(email: string, password: string, firstName: string, lastName: string): AuthResponse {
    const userId = `user-${Date.now()}`;
    const user = {
      id: userId,
      email,
      firstName,
      lastName,
      role: 'user',
    };

    this.mockUsers.set(email, { ...user, password });

    const accessToken = this.generateMockToken(userId);
    const refreshToken = this.generateMockToken(userId, 'refresh');

    this.mockTokens.set(accessToken, { userId, type: 'access', email });
    this.mockTokens.set(refreshToken, { userId, type: 'refresh', email });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  mockLogin(email: string, password: string): AuthResponse | null {
    const user = this.mockUsers.get(email);
    if (!user) {
      return null;
    }

    const accessToken = this.generateMockToken(user.id);
    const refreshToken = this.generateMockToken(user.id, 'refresh');

    this.mockTokens.set(accessToken, { userId: user.id, type: 'access', email });
    this.mockTokens.set(refreshToken, { userId: user.id, type: 'refresh', email });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  mockValidateToken(token: string): { valid: boolean; userId?: string; email?: string } {
    const tokenData = this.mockTokens.get(token);
    if (!tokenData) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: tokenData.userId,
      email: tokenData.email,
    };
  }

  private generateMockToken(userId: string, type: string = 'access'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `mock-${type}-token-${userId}-${timestamp}-${random}`;
  }

  getMockUser(email: string): any {
    return this.mockUsers.get(email);
  }

  clear(): void {
    this.mockUsers.clear();
    this.mockTokens.clear();
    this.setupDefaultMocks();
  }
}

export const authServiceMock = new AuthServiceMock();
