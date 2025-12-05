import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TestFactory } from '../../../test/utils/test-factory';
import { TokenResponseDto } from './dto/token-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    googleLogin: jest.fn(),
    validateOAuthUser: jest.fn(),
    setupMfa: jest.fn(),
    verifyMfa: jest.fn(),
    disableMfa: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = TestFactory.createRegisterDto();
      const mockUser = TestFactory.createUser();
      const mockResponse = new TokenResponseDto(
        'access-token',
        'refresh-token',
        mockUser,
        900,
      );

      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = TestFactory.createLoginDto();
      const mockUser = TestFactory.createUser();
      const mockResponse = new TokenResponseDto(
        'access-token',
        'refresh-token',
        mockUser,
        900,
      );
      const ip = '127.0.0.1';

      authService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto, ip);

      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto, ip);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      const mockUser = TestFactory.createUser();
      const mockResponse = { message: 'Logged out successfully' };

      authService.logout.mockResolvedValue(mockResponse);

      const result = await controller.logout(mockUser);

      expect(result).toEqual(mockResponse);
      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockUser = TestFactory.createUser();
      const mockRequest = { user: mockUser } as any;
      const mockResponse = new TokenResponseDto(
        'new-access-token',
        'new-refresh-token',
        mockUser,
        900,
      );

      authService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      const mockResponse = {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };

      authService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      };
      const mockResponse = { message: 'Password has been reset successfully' };

      authService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(mockResponse);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const verifyEmailDto = { token: 'verification-token' };
      const mockResponse = { message: 'Email verified successfully' };

      authService.verifyEmail.mockResolvedValue(mockResponse);

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(result).toEqual(mockResponse);
      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
    });
  });

  describe('googleLogin', () => {
    it('should initiate Google OAuth', async () => {
      await controller.googleLogin();
      // Guard handles redirect, nothing to assert
      expect(true).toBe(true);
    });
  });

  describe('googleCallback', () => {
    it('should handle Google OAuth callback', async () => {
      const mockUser = TestFactory.createOAuthUser('GOOGLE' as any);
      const mockRequest = { user: mockUser } as any;
      const mockResponse = new TokenResponseDto(
        'access-token',
        'refresh-token',
        mockUser,
        900,
      );

      authService.googleLogin.mockResolvedValue(mockResponse);

      const result = await controller.googleCallback(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(authService.googleLogin).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('setupMfa', () => {
    it('should setup MFA', async () => {
      const mockUser = TestFactory.createUser();
      const mockResponse = {
        secret: 'mfa-secret',
        qrCode: 'data:image/png;base64,...',
        otpauthUrl: 'otpauth://...',
      };

      authService.setupMfa.mockResolvedValue(mockResponse);

      const result = await controller.setupMfa(mockUser);

      expect(result).toEqual(mockResponse);
      expect(authService.setupMfa).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('verifyMfa', () => {
    it('should verify and enable MFA', async () => {
      const mockUser = TestFactory.createUser();
      const mfaVerifyDto = { token: '123456' };
      const mockResponse = { message: 'MFA enabled successfully' };

      authService.verifyMfa.mockResolvedValue(mockResponse);

      const result = await controller.verifyMfa(mockUser, mfaVerifyDto);

      expect(result).toEqual(mockResponse);
      expect(authService.verifyMfa).toHaveBeenCalledWith(
        mockUser.id,
        mfaVerifyDto,
      );
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA', async () => {
      const mockUser = TestFactory.createUser();
      const mockResponse = { message: 'MFA disabled successfully' };

      authService.disableMfa.mockResolvedValue(mockResponse);

      const result = await controller.disableMfa(mockUser);

      expect(result).toEqual(mockResponse);
      expect(authService.disableMfa).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      const mockUser = TestFactory.createUser();

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password');
    });
  });
});
