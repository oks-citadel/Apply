import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus, AuthProvider } from '../../src/modules/users/entities/user.entity';

export class TestFactory {
  /**
   * Create a test user with default values
   * Note: fullName and isLocked are getters on the User entity and cannot be set directly
   */
  static createUser(overrides?: Partial<User>): User {
    const user = new User();

    // Set default values
    user.id = 'test-user-id';
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.password = '$2b$10$XqXqXqXqXqXqXqXqXqXqXeTest'; // Hashed password
    user.firstName = 'Test';
    user.lastName = 'User';
    user.phoneNumber = '+1234567890';
    user.profilePicture = null;
    user.role = UserRole.USER;
    user.status = UserStatus.ACTIVE;
    user.authProvider = AuthProvider.LOCAL;
    user.providerId = null;
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    user.refreshToken = null;
    user.isMfaEnabled = false;
    user.mfaSecret = null;
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = null;
    user.lastLoginIp = null;
    user.createdAt = new Date();
    user.metadata = {};
    user.updatedAt = new Date();

    // Apply overrides (excluding getter properties)
    if (overrides) {
      const { fullName, isLocked, ...validOverrides } = overrides as any;
      Object.assign(user, validOverrides);
    }

    return user;
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
   * Note: isLocked is a getter that returns true if lockedUntil > current time
   */
  static createLockedUser(overrides?: Partial<User>): User {
    return this.createUser({
      lockedUntil: new Date(Date.now() + 900000), // 15 minutes from now
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
    return `test-token-${  Math.random().toString(36).substring(7)}`;
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
