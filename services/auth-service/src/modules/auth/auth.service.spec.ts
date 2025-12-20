import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { mockConfigService, mockJwtService, mockUsersService, mockEmailService } from '../../../test/utils/mock-config';
import { TestFactory } from '../../../test/utils/test-factory';
import { EmailService } from '../email/email.service';
import { UserStatus, AuthProvider } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import type { TestingModule } from '@nestjs/testing';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;

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
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    emailService = module.get(EmailService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = TestFactory.createRegisterDto();
      const mockUser = TestFactory.createUnverifiedUser({
        email: registerDto.email,
      });

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('mock-access-token');

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      // The service returns a partial user in TokenResponseDto
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = TestFactory.createRegisterDto();
      const existingUser = TestFactory.createUser();

      usersService.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      const registerDto = TestFactory.createRegisterDto({
        username: 'existinguser',
      });
      const existingUser = TestFactory.createUser();

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findByUsername).toHaveBeenCalledWith('existinguser');
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should create user with pending verification status', async () => {
      const registerDto = TestFactory.createRegisterDto();
      const mockUser = TestFactory.createUnverifiedUser();

      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('mock-token');

      await service.register(registerDto);

      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall.status).toBe(UserStatus.PENDING_VERIFICATION);
      expect(createCall.isEmailVerified).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = TestFactory.createLoginDto();
      const mockUser = TestFactory.createUser({
        email: loginDto.email,
      });

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);
      usersService.resetLoginAttempts.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      usersService.updateRefreshToken.mockResolvedValue(undefined);
      jwtService.signAsync.mockResolvedValue('mock-access-token');

      const result = await service.login(loginDto, '127.0.0.1');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(usersService.resetLoginAttempts).toHaveBeenCalledWith(mockUser.id);
      expect(usersService.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id,
        '127.0.0.1',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = TestFactory.createLoginDto();

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = TestFactory.createLoginDto();
      const mockUser = TestFactory.createUser();

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.incrementLoginAttempts).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      const loginDto = TestFactory.createLoginDto();
      const lockedUser = TestFactory.createLockedUser();

      usersService.findByEmail.mockResolvedValue(lockedUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      const loginDto = TestFactory.createLoginDto();
      const suspendedUser = TestFactory.createUser({
        status: UserStatus.SUSPENDED,
      });

      usersService.findByEmail.mockResolvedValue(suspendedUser);
      usersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should require MFA token if MFA is enabled', async () => {
      const loginDto = TestFactory.createLoginDto(); // No MFA token
      const mfaUser = TestFactory.createMfaUser();

      usersService.findByEmail.mockResolvedValue(mfaUser);
      usersService.validatePassword.mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user has no password (OAuth)', async () => {
      const loginDto = TestFactory.createLoginDto();
      const oauthUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

      usersService.findByEmail.mockResolvedValue(oauthUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const userId = 'test-user-id';

      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.logout(userId);

      expect(result.message).toBe('Logged out successfully');
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens for valid user', async () => {
      const mockUser = TestFactory.createUser();

      jwtService.signAsync.mockResolvedValue('new-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshToken(mockUser);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2); // access + refresh
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      const mockUser = TestFactory.createUser({
        email: forgotPasswordDto.email,
      });

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.setPasswordResetToken.mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
      expect(usersService.setPasswordResetToken).toHaveBeenCalled();
    });

    it('should not reveal if user does not exist', async () => {
      const forgotPasswordDto = { email: 'nonexistent@example.com' };

      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
    });

    it('should not send reset email for OAuth users', async () => {
      const forgotPasswordDto = { email: 'oauth@example.com' };
      const oauthUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

      usersService.findByEmail.mockResolvedValue(oauthUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result.message).toContain('password reset link');
      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      const resetPasswordDto = {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      };
      const mockUser = TestFactory.createUser({
        passwordResetToken: 'valid-reset-token',
        passwordResetExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      });

      usersService.findAll.mockResolvedValue([mockUser]);
      usersService.resetPassword.mockResolvedValue(undefined);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result.message).toContain('reset successfully');
      expect(usersService.resetPassword).toHaveBeenCalledWith(
        mockUser.id,
        resetPasswordDto.newPassword,
      );
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      const resetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      };

      usersService.findAll.mockResolvedValue([]);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const resetPasswordDto = {
        token: 'expired-token',
        newPassword: 'NewPassword123!',
      };
      const mockUser = TestFactory.createUser({
        passwordResetToken: 'expired-token',
        passwordResetExpiry: new Date(Date.now() - 3600000), // 1 hour ago
      });

      usersService.findAll.mockResolvedValue([mockUser]);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid token', async () => {
      const verifyEmailDto = { token: 'valid-verification-token' };
      const mockUser = TestFactory.createUnverifiedUser({
        emailVerificationToken: 'valid-verification-token',
        emailVerificationExpiry: new Date(Date.now() + 86400000),
      });

      usersService.findAll.mockResolvedValue([mockUser]);
      usersService.verifyEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail(verifyEmailDto);

      expect(result.message).toContain('verified successfully');
      expect(usersService.verifyEmail).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw BadRequestException for invalid token', async () => {
      const verifyEmailDto = { token: 'invalid-token' };

      usersService.findAll.mockResolvedValue([]);

      await expect(service.verifyEmail(verifyEmailDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateOAuthUser', () => {
    it('should return existing user by provider ID', async () => {
      const profile = {
        providerId: 'google-123',
        provider: 'google',
        email: 'oauth@example.com',
        firstName: 'OAuth',
        lastName: 'User',
      };
      const existingUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

      usersService.findByProviderId.mockResolvedValue(existingUser);
      usersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.validateOAuthUser(profile);

      expect(result).toEqual(existingUser);
      expect(usersService.updateLastLogin).toHaveBeenCalled();
    });

    it('should link OAuth account to existing email', async () => {
      const profile = {
        providerId: 'google-123',
        provider: 'google',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
      };
      const existingUser = TestFactory.createUser({
        email: profile.email,
      });

      usersService.findByProviderId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(existingUser);
      usersService.update.mockResolvedValue(undefined);

      const result = await service.validateOAuthUser(profile);

      expect(result).toEqual(existingUser);
      expect(usersService.update).toHaveBeenCalledWith(
        existingUser.id,
        expect.objectContaining({
          providerId: profile.providerId,
          authProvider: profile.provider,
        }),
      );
    });

    it('should create new user for new OAuth login', async () => {
      const profile = {
        providerId: 'google-123',
        provider: 'google',
        email: 'newoauth@example.com',
        firstName: 'New',
        lastName: 'OAuth',
      };
      const newUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

      usersService.findByProviderId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(newUser);

      const result = await service.validateOAuthUser(profile);

      expect(result).toEqual(newUser);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: profile.email,
          authProvider: profile.provider,
          isEmailVerified: true,
        }),
      );
    });
  });

  describe('setupMfa', () => {
    it('should generate MFA secret and QR code', async () => {
      const userId = 'test-user-id';
      const mockUser = TestFactory.createUser({ id: userId });

      usersService.findByIdOrFail.mockResolvedValue(mockUser);
      usersService.updateMfaSecret.mockResolvedValue(undefined);

      const result = await service.setupMfa(userId);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('otpauthUrl');
      expect(usersService.updateMfaSecret).toHaveBeenCalled();
    });
  });

  describe('verifyMfa', () => {
    it('should enable MFA with valid token', async () => {
      const userId = 'test-user-id';
      const mfaVerifyDto = { token: '123456' };
      const mockUser = TestFactory.createUser({
        id: userId,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });

      usersService.findByIdOrFail.mockResolvedValue(mockUser);
      usersService.enableMfa.mockResolvedValue(undefined);

      // Mock speakeasy verification
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(true);

      const result = await service.verifyMfa(userId, mfaVerifyDto);

      expect(result.message).toContain('enabled successfully');
      expect(usersService.enableMfa).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException if MFA not setup', async () => {
      const userId = 'test-user-id';
      const mfaVerifyDto = { token: '123456' };
      const mockUser = TestFactory.createUser({
        id: userId,
        mfaSecret: null,
      });

      usersService.findByIdOrFail.mockResolvedValue(mockUser);

      await expect(service.verifyMfa(userId, mfaVerifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException for invalid MFA token', async () => {
      const userId = 'test-user-id';
      const mfaVerifyDto = { token: '000000' };
      const mockUser = TestFactory.createUser({
        id: userId,
        mfaSecret: 'JBSWY3DPEHPK3PXP',
      });

      usersService.findByIdOrFail.mockResolvedValue(mockUser);

      // Mock speakeasy verification to return false
      jest.spyOn(require('speakeasy').totp, 'verify').mockReturnValue(false);

      await expect(service.verifyMfa(userId, mfaVerifyDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('disableMfa', () => {
    it('should successfully disable MFA', async () => {
      const userId = 'test-user-id';

      usersService.disableMfa.mockResolvedValue(undefined);

      const result = await service.disableMfa(userId);

      expect(result.message).toContain('disabled successfully');
      expect(usersService.disableMfa).toHaveBeenCalledWith(userId);
    });
  });
});
