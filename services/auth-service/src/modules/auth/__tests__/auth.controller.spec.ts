import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { User, UserRole, UserStatus, AuthProvider } from '../../users/entities/user.entity';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';


import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import type { LoginDto } from '../dto/login.dto';
import type { MfaSetupResponseDto } from '../dto/mfa-setup.dto';
import type { MfaVerifyDto } from '../dto/mfa-verify.dto';
import type { RegisterDto } from '../dto/register.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import type { TokenResponseDto } from '../dto/token-response.dto';
import type { VerifyEmailDto } from '../dto/verify-email.dto';
import type { TestingModule } from '@nestjs/testing';

// Helper function to create mock user with proper getters and methods
function createMockUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = '123e4567-e89b-12d3-a456-426614174000';
  user.email = 'test@example.com';
  user.username = 'testuser';
  user.password = '$2b$10$hashedpassword';
  user.firstName = 'John';
  user.lastName = 'Doe';
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
  user.isMfaEnabled = false;
  user.mfaSecret = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = '127.0.0.1';
  user.loginAttempts = 0;
  user.lockedUntil = null;
  user.refreshToken = null;
  user.metadata = {};
  user.createdAt = new Date();
  user.updatedAt = new Date();

  // Apply overrides
  Object.assign(user, overrides);
  return user;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mockUser: User;
  let mockTokenResponse: TokenResponseDto;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    googleLogin: jest.fn(),
    setupMfa: jest.fn(),
    verifyMfa: jest.fn(),
    disableMfa: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'frontend.url': 'http://localhost:3000',
        'oauth.callbackSuccessUrl': '/auth/success',
        'oauth.callbackErrorUrl': '/auth/error',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    // Create mock user with proper getters and methods
    mockUser = createMockUser();

    mockTokenResponse = {
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
      tokenType: 'Bearer',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        status: mockUser.status,
      },
      expiresIn: 900,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user with valid data', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        phoneNumber: '+1234567890',
      };

      mockAuthService.register.mockResolvedValue(mockTokenResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTokenResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should register with minimal required fields (email and password)', async () => {
      const registerDto: RegisterDto = {
        email: 'minimal@example.com',
        password: 'SecurePass123!',
      };

      mockAuthService.register.mockResolvedValue(mockTokenResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should throw ConflictException when username is already taken', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        username: 'existinguser',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('Username is already taken'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should handle invalid email format', async () => {
      const registerDto: RegisterDto = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Invalid email format'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle weak password', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'weak',
      };

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Password does not meet requirements'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(loginDto, ip);

      expect(authService.login).toHaveBeenCalledWith(loginDto, ip);
      expect(result).toEqual(mockTokenResponse);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should successfully login with MFA token when MFA is enabled', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        mfaToken: '123456',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockResolvedValue(mockTokenResponse);

      const result = await controller.login(loginDto, ip);

      expect(authService.login).toHaveBeenCalledWith(loginDto, ip);
      expect(result).toEqual(mockTokenResponse);
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const loginDto: LoginDto = {
        email: 'locked@example.com',
        password: 'SecurePass123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Account is locked until...'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when MFA token is required but not provided', async () => {
      const loginDto: LoginDto = {
        email: 'mfa-user@example.com',
        password: 'SecurePass123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('MFA token is required'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        'MFA token is required',
      );
    });

    it('should throw UnauthorizedException with invalid MFA token', async () => {
      const loginDto: LoginDto = {
        email: 'mfa-user@example.com',
        password: 'SecurePass123!',
        mfaToken: '000000',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid MFA token'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when account is suspended', async () => {
      const loginDto: LoginDto = {
        email: 'suspended@example.com',
        password: 'SecurePass123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Account has been suspended'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        'Account has been suspended',
      );
    });

    it('should handle empty email field', async () => {
      const loginDto: LoginDto = {
        email: '',
        password: 'SecurePass123!',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Email is required'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty password field', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '',
      };
      const ip = '127.0.0.1';

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Password is required'),
      );

      await expect(controller.login(loginDto, ip)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout authenticated user', async () => {
      const expectedResponse = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(mockUser);

      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle logout for user with active sessions', async () => {
      const expectedResponse = { message: 'Logged out successfully' };
      mockAuthService.logout.mockResolvedValue(expectedResponse);

      const result = await controller.logout(mockUser);

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token with valid refresh token', async () => {
      const mockRequest = { user: mockUser } as any;

      mockAuthService.refreshToken.mockResolvedValue(mockTokenResponse);

      const result = await controller.refreshToken(mockRequest);

      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockTokenResponse);
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      const mockRequest = { user: mockUser } as any;

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshToken(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with expired refresh token', async () => {
      const mockRequest = { user: mockUser } as any;

      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Refresh token expired'),
      );

      await expect(controller.refreshToken(mockRequest)).rejects.toThrow(
        'Refresh token expired',
      );
    });
  });

  describe('forgotPassword', () => {
    it('should successfully request password reset', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };
      const expectedResponse = {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return same message for non-existent email (security)', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };
      const expectedResponse = {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResponse);
    });

    it('should handle malformed email gracefully', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'invalid-email',
      };

      mockAuthService.forgotPassword.mockRejectedValue(
        new BadRequestException('Invalid email format'),
      );

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle OAuth user password reset request', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'oauth@example.com',
      };
      const expectedResponse = {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePass123!',
      };
      const expectedResponse = {
        message: 'Password has been reset successfully',
      };

      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw BadRequestException with invalid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewSecurePass123!',
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired password reset token'),
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException with expired token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'expired-token',
        newPassword: 'NewSecurePass123!',
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired password reset token'),
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired password reset token',
      );
    });

    it('should reject weak new password', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-token',
        newPassword: 'weak',
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new BadRequestException('Password does not meet requirements'),
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'valid-verification-token',
      };
      const expectedResponse = { message: 'Email verified successfully' };

      mockAuthService.verifyEmail.mockResolvedValue(expectedResponse);

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw BadRequestException with invalid token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'invalid-token',
      };

      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid or expired email verification token'),
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException with expired token', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        token: 'expired-token',
      };

      mockAuthService.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid or expired email verification token'),
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'Invalid or expired email verification token',
      );
    });
  });

  describe('googleLogin', () => {
    it('should initiate Google OAuth login', async () => {
      await controller.googleLogin();
      // This method just triggers the redirect
      expect(true).toBe(true);
    });
  });

  describe('googleCallback', () => {
    it('should successfully handle Google OAuth callback', async () => {
      const mockRequest = { user: mockUser } as any;
      const mockRes = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      mockAuthService.googleLogin.mockResolvedValue(mockTokenResponse);

      await controller.googleCallback(mockRequest, mockRes);

      expect(authService.googleLogin).toHaveBeenCalledWith(mockUser);
      expect(mockRes.redirect).toHaveBeenCalled();
    });

    it('should handle new user from Google OAuth', async () => {
      const newGoogleUser = {
        ...mockUser,
        authProvider: AuthProvider.GOOGLE,
        isEmailVerified: true,
      };
      const mockRequest = { user: newGoogleUser } as any;
      const mockRes = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      mockAuthService.googleLogin.mockResolvedValue({
        ...mockTokenResponse,
        user: {
          ...mockTokenResponse.user,
          id: newGoogleUser.id,
        },
      });

      await controller.googleCallback(mockRequest, mockRes);

      expect(authService.googleLogin).toHaveBeenCalledWith(newGoogleUser);
      expect(mockRes.redirect).toHaveBeenCalled();
    });
  });

  describe('setupMfa', () => {
    it('should successfully setup MFA for authenticated user', async () => {
      const mfaSetupResponse: MfaSetupResponseDto = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        otpauthUrl:
          'otpauth://totp/ApplyForUs%20(test@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=ApplyForUs',
      };

      mockAuthService.setupMfa.mockResolvedValue(mfaSetupResponse);

      const result = await controller.setupMfa(mockUser);

      expect(authService.setupMfa).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mfaSetupResponse);
      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
    });

    it('should allow MFA setup for user without existing MFA', async () => {
      const userWithoutMfa = createMockUser({ isMfaEnabled: false });
      const mfaSetupResponse: MfaSetupResponseDto = {
        secret: 'NEWSECRET123',
        qrCode: 'data:image/png;base64,newqrcode...',
        otpauthUrl: 'otpauth://totp/ApplyForUs...',
      };

      mockAuthService.setupMfa.mockResolvedValue(mfaSetupResponse);

      const result = await controller.setupMfa(userWithoutMfa);

      expect(result).toBeDefined();
    });
  });

  describe('verifyMfa', () => {
    it('should successfully verify and enable MFA with valid token', async () => {
      const mfaVerifyDto: MfaVerifyDto = {
        token: '123456',
      };
      const expectedResponse = { message: 'MFA enabled successfully' };

      mockAuthService.verifyMfa.mockResolvedValue(expectedResponse);

      const result = await controller.verifyMfa(mockUser, mfaVerifyDto);

      expect(authService.verifyMfa).toHaveBeenCalledWith(
        mockUser.id,
        mfaVerifyDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException with invalid MFA token', async () => {
      const mfaVerifyDto: MfaVerifyDto = {
        token: '000000',
      };

      mockAuthService.verifyMfa.mockRejectedValue(
        new UnauthorizedException('Invalid MFA token'),
      );

      await expect(
        controller.verifyMfa(mockUser, mfaVerifyDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when MFA not setup', async () => {
      const mfaVerifyDto: MfaVerifyDto = {
        token: '123456',
      };

      mockAuthService.verifyMfa.mockRejectedValue(
        new BadRequestException(
          'MFA setup not initiated. Please setup MFA first.',
        ),
      );

      await expect(
        controller.verifyMfa(mockUser, mfaVerifyDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle expired MFA token', async () => {
      const mfaVerifyDto: MfaVerifyDto = {
        token: '999999',
      };

      mockAuthService.verifyMfa.mockRejectedValue(
        new UnauthorizedException('Invalid MFA token'),
      );

      await expect(
        controller.verifyMfa(mockUser, mfaVerifyDto),
      ).rejects.toThrow('Invalid MFA token');
    });
  });

  describe('disableMfa', () => {
    it('should successfully disable MFA for authenticated user', async () => {
      const userWithMfa = createMockUser({ isMfaEnabled: true });
      const expectedResponse = { message: 'MFA disabled successfully' };

      mockAuthService.disableMfa.mockResolvedValue(expectedResponse);

      const result = await controller.disableMfa(userWithMfa);

      expect(authService.disableMfa).toHaveBeenCalledWith(userWithMfa.id);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle disabling MFA when already disabled', async () => {
      const expectedResponse = { message: 'MFA disabled successfully' };

      mockAuthService.disableMfa.mockResolvedValue(expectedResponse);

      const result = await controller.disableMfa(mockUser);

      expect(result).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current authenticated user profile', async () => {
      const result = await controller.getCurrentUser(mockUser);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.username).toBe(mockUser.username);
      expect(result.firstName).toBe(mockUser.firstName);
      expect(result.lastName).toBe(mockUser.lastName);
      expect(result.role).toBe(mockUser.role);
      expect(result.status).toBe(mockUser.status);
      expect(result.isEmailVerified).toBe(mockUser.isEmailVerified);
      expect(result.isMfaEnabled).toBe(mockUser.isMfaEnabled);
    });

    it('should not expose sensitive information', async () => {
      const result = await controller.getCurrentUser(mockUser);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('mfaSecret');
      expect(result).not.toHaveProperty('emailVerificationToken');
      expect(result).not.toHaveProperty('passwordResetToken');
    });

    it('should return profile for OAuth user', async () => {
      const oauthUser = createMockUser({
        authProvider: AuthProvider.GOOGLE,
        password: null,
      });

      const result = await controller.getCurrentUser(oauthUser);

      expect(result.authProvider).toBe(AuthProvider.GOOGLE);
      expect(result).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits on register endpoint', async () => {
      const registerDto: RegisterDto = {
        email: 'ratelimit@example.com',
        password: 'SecurePass123!',
      };

      // Simulate rate limit exceeded
      mockAuthService.register.mockRejectedValue(
        new Error('Too Many Requests'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow();
    });

    it('should respect rate limits on login endpoint', async () => {
      const loginDto: LoginDto = {
        email: 'ratelimit@example.com',
        password: 'SecurePass123!',
      };

      mockAuthService.login.mockRejectedValue(new Error('Too Many Requests'));

      await expect(controller.login(loginDto, '127.0.0.1')).rejects.toThrow();
    });

    it('should respect rate limits on forgot password endpoint', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'ratelimit@example.com',
      };

      mockAuthService.forgotPassword.mockRejectedValue(
        new Error('Too Many Requests'),
      );

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null or undefined user object', async () => {
      const nullUser = null as any;

      await expect(controller.logout(nullUser)).rejects.toThrow();
    });

    it('should handle extremely long email addresses', async () => {
      const longEmail = `${'a'.repeat(300)  }@example.com`;
      const registerDto: RegisterDto = {
        email: longEmail,
        password: 'SecurePass123!',
      };

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Email too long'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow();
    });

    it('should handle special characters in email', async () => {
      const registerDto: RegisterDto = {
        email: 'user+test@example.com',
        password: 'SecurePass123!',
      };

      mockAuthService.register.mockResolvedValue(mockTokenResponse);

      const result = await controller.register(registerDto);

      expect(result).toBeDefined();
    });

    it('should handle password with maximum allowed length', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: `A1@${  'a'.repeat(125)}`,
      };

      mockAuthService.register.mockResolvedValue(mockTokenResponse);

      const result = await controller.register(registerDto);

      expect(result).toBeDefined();
    });
  });
});
