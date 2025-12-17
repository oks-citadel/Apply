import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { EmailService } from '../../email/email.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { MfaVerifyDto } from '../dto/mfa-verify.dto';
import { User, UserRole, UserStatus, AuthProvider } from '../../users/entities/user.entity';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Mock external dependencies
jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('qrcode');

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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;
  let mockUser: User;

  beforeEach(() => {
    mockUser = createMockUser();
  });

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByProviderId: jest.fn(),
    findByIdOrFail: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    validatePassword: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    updateLastLogin: jest.fn(),
    updateRefreshToken: jest.fn(),
    setPasswordResetToken: jest.fn(),
    setEmailVerificationToken: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    updateMfaSecret: jest.fn(),
    enableMfa: jest.fn(),
    disableMfa: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'security.maxLoginAttempts': 5,
        'security.lockoutDuration': 900,
        'jwt.accessTokenExpiresIn': '15m',
        'jwt.refreshTokenExpiresIn': '7d',
        'jwt.issuer': 'applyforus',
        'jwt.audience': 'applyforus-users',
        'email.verificationExpiresIn': 86400,
        'email.passwordResetExpiresIn': 3600,
      };
      return config[key] || defaultValue;
    }),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      username: 'janesmith',
      phoneNumber: '+1234567890',
    };

    it('should successfully register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should throw ConflictException if username is taken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Username is already taken',
      );
    });

    it('should register user even if email sending fails', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');
      mockEmailService.sendVerificationEmail.mockRejectedValue(
        new Error('Email service unavailable'),
      );

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('should create user with PENDING_VERIFICATION status', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        status: UserStatus.PENDING_VERIFICATION,
      });
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: UserStatus.PENDING_VERIFICATION,
          isEmailVerified: false,
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should successfully login with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.resetLoginAttempts.mockResolvedValue(undefined);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');

      const result = await service.login(loginDto, '127.0.0.1');

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(usersService.validatePassword).toHaveBeenCalled();
      expect(usersService.resetLoginAttempts).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id,
        '127.0.0.1',
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 900000),
      };
      Object.defineProperty(lockedUser, 'isLocked', {
        get: () => true,
      });

      mockUsersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        /Account is locked until/,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);
      mockUsersService.incrementLoginAttempts.mockResolvedValue(undefined);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.incrementLoginAttempts).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should throw UnauthorizedException for suspended account', async () => {
      const suspendedUser = createMockUser({ status: UserStatus.SUSPENDED });
      mockUsersService.findByEmail.mockResolvedValue(suspendedUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        'Account has been suspended',
      );
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      const inactiveUser = createMockUser({ status: UserStatus.INACTIVE });
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        'Account is inactive',
      );
    });

    it('should throw UnauthorizedException for OAuth users without password', async () => {
      const oauthUser = createMockUser({
        password: null,
        authProvider: AuthProvider.GOOGLE,
      });
      mockUsersService.findByEmail.mockResolvedValue(oauthUser);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        /social login/,
      );
    });

    it('should require MFA token when MFA is enabled', async () => {
      const mfaUser = createMockUser({ isMfaEnabled: true });
      mockUsersService.findByEmail.mockResolvedValue(mfaUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        'MFA token is required',
      );
    });

    it('should successfully login with valid MFA token', async () => {
      const mfaUser = {
        ...mockUser,
        isMfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      };
      const loginWithMfa = { ...loginDto, mfaToken: '123456' };

      mockUsersService.findByEmail.mockResolvedValue(mfaUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.resetLoginAttempts.mockResolvedValue(undefined);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.login(loginWithMfa, '127.0.0.1');

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException with invalid MFA token', async () => {
      const mfaUser = {
        ...mockUser,
        isMfaEnabled: true,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      };
      const loginWithMfa = { ...loginDto, mfaToken: '000000' };

      mockUsersService.findByEmail.mockResolvedValue(mfaUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.login(loginWithMfa, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginWithMfa, '127.0.0.1')).rejects.toThrow(
        'Invalid MFA token',
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(mockUser.id);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('new.mock.jwt.token');

      const result = await service.refreshToken(mockUser);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should send password reset email for existing user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.setPasswordResetToken.mockResolvedValue(undefined);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(usersService.setPasswordResetToken).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain('password reset link');
    });

    it('should return generic message for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return generic message for OAuth users', async () => {
      const oauthUser = {
        ...mockUser,
        authProvider: AuthProvider.GOOGLE,
      };
      mockUsersService.findByEmail.mockResolvedValue(oauthUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not fail if email sending fails', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.setPasswordResetToken.mockResolvedValue(undefined);
      mockEmailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('Email service down'),
      );

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewSecurePass123!',
    };

    it('should successfully reset password with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        passwordResetToken: 'valid-reset-token',
        passwordResetExpiry: new Date(Date.now() + 3600000),
      };

      mockUsersService.findAll.mockResolvedValue([userWithToken]);
      mockUsersService.resetPassword.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.resetPassword(resetPasswordDto);

      expect(usersService.resetPassword).toHaveBeenCalledWith(
        userWithToken.id,
        resetPasswordDto.newPassword,
      );
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        userWithToken.id,
        null,
      );
      expect(result.message).toBe('Password has been reset successfully');
    });

    it('should throw BadRequestException with invalid token', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired password reset token',
      );
    });

    it('should throw BadRequestException with expired token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        passwordResetToken: 'valid-reset-token',
        passwordResetExpiry: new Date(Date.now() - 3600000),
      };

      mockUsersService.findAll.mockResolvedValue([userWithExpiredToken]);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = {
      token: 'valid-verification-token',
    };

    it('should successfully verify email with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        emailVerificationToken: 'valid-verification-token',
        emailVerificationExpiry: new Date(Date.now() + 86400000),
        isEmailVerified: false,
      };

      mockUsersService.findAll.mockResolvedValue([userWithToken]);
      mockUsersService.verifyEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail(verifyEmailDto);

      expect(usersService.verifyEmail).toHaveBeenCalledWith(userWithToken.id);
      expect(result.message).toBe('Email verified successfully');
    });

    it('should throw BadRequestException with invalid token', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        'Invalid or expired email verification token',
      );
    });

    it('should throw BadRequestException with expired token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        emailVerificationToken: 'valid-verification-token',
        emailVerificationExpiry: new Date(Date.now() - 86400000),
        isEmailVerified: false,
      };

      mockUsersService.findAll.mockResolvedValue([userWithExpiredToken]);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('googleLogin', () => {
    it('should generate tokens for Google OAuth user', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');

      const result = await service.googleLogin(mockUser);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });

  describe('validateOAuthUser', () => {
    const oauthProfile = {
      providerId: 'google-123456',
      provider: 'google',
      email: 'oauth@example.com',
      firstName: 'OAuth',
      lastName: 'User',
      profilePicture: 'https://example.com/avatar.jpg',
    };

    it('should return existing user if found by provider ID', async () => {
      const existingUser = {
        ...mockUser,
        providerId: 'google-123456',
        authProvider: AuthProvider.GOOGLE,
      };

      mockUsersService.findByProviderId.mockResolvedValue(existingUser);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.validateOAuthUser(oauthProfile);

      expect(result).toEqual(existingUser);
      expect(usersService.findByProviderId).toHaveBeenCalledWith(
        oauthProfile.providerId,
      );
      expect(usersService.updateLastLogin).toHaveBeenCalled();
    });

    it('should link OAuth account to existing email user', async () => {
      mockUsersService.findByProviderId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.validateOAuthUser(oauthProfile);

      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          providerId: oauthProfile.providerId,
          authProvider: oauthProfile.provider,
        }),
      );
    });

    it('should create new user for new OAuth account', async () => {
      const newOAuthUser = {
        ...mockUser,
        providerId: oauthProfile.providerId,
        authProvider: AuthProvider.GOOGLE,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      };

      mockUsersService.findByProviderId.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newOAuthUser);

      const result = await service.validateOAuthUser(oauthProfile);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: oauthProfile.email,
          providerId: oauthProfile.providerId,
          isEmailVerified: true,
          status: UserStatus.ACTIVE,
        }),
      );
      expect(result).toEqual(newOAuthUser);
    });
  });

  describe('setupMfa', () => {
    it('should successfully setup MFA for user', async () => {
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url:
          'otpauth://totp/ApplyForUs%20(test@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=ApplyForUs',
      };
      const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANS...';

      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQrCode);

      mockUsersService.findByIdOrFail.mockResolvedValue(mockUser);
      mockUsersService.updateMfaSecret.mockResolvedValue(undefined);

      const result = await service.setupMfa(mockUser.id);

      expect(result.secret).toBe(mockSecret.base32);
      expect(result.qrCode).toBe(mockQrCode);
      expect(result.otpauthUrl).toBe(mockSecret.otpauth_url);
      expect(usersService.updateMfaSecret).toHaveBeenCalledWith(
        mockUser.id,
        mockSecret.base32,
      );
    });
  });

  describe('verifyMfa', () => {
    const mfaVerifyDto: MfaVerifyDto = {
      token: '123456',
    };

    it('should successfully verify and enable MFA', async () => {
      const userWithMfaSecret = {
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      };

      mockUsersService.findByIdOrFail.mockResolvedValue(userWithMfaSecret);
      mockUsersService.enableMfa.mockResolvedValue(undefined);

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const result = await service.verifyMfa(mockUser.id, mfaVerifyDto);

      expect(result.message).toBe('MFA enabled successfully');
      expect(usersService.enableMfa).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException when MFA not setup', async () => {
      mockUsersService.findByIdOrFail.mockResolvedValue(mockUser);

      await expect(service.verifyMfa(mockUser.id, mfaVerifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyMfa(mockUser.id, mfaVerifyDto)).rejects.toThrow(
        'MFA setup not initiated',
      );
    });

    it('should throw UnauthorizedException with invalid token', async () => {
      const userWithMfaSecret = {
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      };

      mockUsersService.findByIdOrFail.mockResolvedValue(userWithMfaSecret);

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      await expect(service.verifyMfa(mockUser.id, mfaVerifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyMfa(mockUser.id, mfaVerifyDto)).rejects.toThrow(
        'Invalid MFA token',
      );
    });
  });

  describe('disableMfa', () => {
    it('should successfully disable MFA', async () => {
      mockUsersService.disableMfa.mockResolvedValue(undefined);

      const result = await service.disableMfa(mockUser.id);

      expect(usersService.disableMfa).toHaveBeenCalledWith(mockUser.id);
      expect(result.message).toBe('MFA disabled successfully');
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'SecurePass123!',
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'WrongPassword',
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });

    it('should return null for user without password (OAuth)', async () => {
      const oauthUser = createMockUser({ password: null });
      mockUsersService.findByEmail.mockResolvedValue(oauthUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle concurrent login attempts', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.resetLoginAttempts.mockResolvedValue(undefined);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const promises = [
        service.login(loginDto, '127.0.0.1'),
        service.login(loginDto, '127.0.0.2'),
        service.login(loginDto, '127.0.0.3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.accessToken).toBeDefined();
      });
    });

    it('should generate unique tokens for each registration', async () => {
      const registerDto: RegisterDto = {
        email: 'unique@example.com',
        password: 'SecurePass123!',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      let callCount = 0;
      mockJwtService.signAsync.mockImplementation(() => {
        callCount++;
        return Promise.resolve(`mock.jwt.token.${callCount}`);
      });

      const result1 = await service.register(registerDto);
      const result2 = await service.register(registerDto);

      expect(result1.accessToken).not.toBe(result2.accessToken);
    });

    it('should properly clean up tokens on password reset', async () => {
      const userWithToken = {
        ...mockUser,
        passwordResetToken: 'valid-token',
        passwordResetExpiry: new Date(Date.now() + 3600000),
      };

      const resetDto: ResetPasswordDto = {
        token: 'valid-token',
        newPassword: 'NewSecurePass123!',
      };

      mockUsersService.findAll.mockResolvedValue([userWithToken]);
      mockUsersService.resetPassword.mockResolvedValue(undefined);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.resetPassword(resetDto);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        userWithToken.id,
        null,
      );
    });

    it('should handle timezone differences in token expiry', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);

      const userWithToken = {
        ...mockUser,
        emailVerificationToken: 'token',
        emailVerificationExpiry: futureDate,
      };

      mockUsersService.findAll.mockResolvedValue([userWithToken]);
      mockUsersService.verifyEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail({ token: 'token' });

      expect(result.message).toBe('Email verified successfully');
    });
  });
});
