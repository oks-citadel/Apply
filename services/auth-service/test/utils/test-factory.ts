import { User, UserRole, UserStatus, AuthProvider } from '../../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export class TestFactory {
  /**
   * Create a test user with default values
   */
  static createUser(overrides?: Partial<User>): User {
    const defaultUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      password: '$2b$10$XqXqXqXqXqXqXqXqXqXqXeTest', // Hashed password
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
      profilePicture: null,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.LOCAL,
      providerId: null,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshToken: null,
      isMfaEnabled: false,
      mfaSecret: null,
      loginAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: new Date(),
      metadata: {},
      updatedAt: new Date(),
      ...overrides,
    };

    return defaultUser as User;
  }

  /**
   * Create multiple test users
   */
  static createUsers(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) =>
      this.createUser({
        id: `test-user-${i}`,
        email: `test${i}@example.com`,
        username: `testuser${i}`,
        ...overrides,
      }),
    );
  }

  /**
   * Create a user with pending verification
   */
  static createUnverifiedUser(overrides?: Partial<User>): User {
    return this.createUser({
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
      emailVerificationToken: 'test-verification-token',
      emailVerificationExpiry: new Date(Date.now() + 86400000), // 24 hours
      ...overrides,
    });
  }

  /**
   * Create a locked user
   */
  static createLockedUser(overrides?: Partial<User>): User {
    return this.createUser({
      isLocked: true,
      lockedUntil: new Date(Date.now() + 900000), // 15 minutes
      loginAttempts: 5,
      ...overrides,
    });
  }

  /**
   * Create a user with MFA enabled
   */
  static createMfaUser(overrides?: Partial<User>): User {
    return this.createUser({
      isMfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Base32 encoded secret
      ...overrides,
    });
  }

  /**
   * Create an OAuth user
   */
  static createOAuthUser(provider: AuthProvider, overrides?: Partial<User>): User {
    return this.createUser({
      authProvider: provider,
      providerId: `${provider}-provider-id`,
      password: null,
      isEmailVerified: true,
      ...overrides,
    });
  }

  /**
   * Create an admin user
   */
  static createAdminUser(overrides?: Partial<User>): User {
    return this.createUser({
      role: UserRole.ADMIN,
      ...overrides,
    });
  }

  /**
   * Create a JWT payload
   */
  static createJwtPayload(user: User) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Create a test token
   */
  static createToken(): string {
    return 'test-token-' + Math.random().toString(36).substring(7);
  }

  /**
   * Create register DTO
   */
  static createRegisterDto(overrides?: any) {
    return {
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      username: 'newuser',
      phoneNumber: '+1234567890',
      ...overrides,
    };
  }

  /**
   * Create login DTO
   */
  static createLoginDto(overrides?: any) {
    return {
      email: 'test@example.com',
      password: 'Password123!',
      ...overrides,
    };
  }
}
