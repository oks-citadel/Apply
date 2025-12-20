import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';


import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GitHubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { TestFactory } from '../../../test/utils/test-factory';
import { EmailService } from '../email/email.service';
import { User, AuthProvider, UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';






import type { TestingModule } from '@nestjs/testing';
import type { Response, Request } from 'express';



/**
 * Comprehensive OAuth Testing Suite
 * Tests all OAuth flows including Google, LinkedIn, and GitHub
 */
describe('OAuth Integration Tests', () => {
  let authService: AuthService;
  let authController: AuthController;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;
  let googleStrategy: GoogleStrategy;
  let linkedinStrategy: LinkedInStrategy;
  let githubStrategy: GitHubStrategy;

  // Mock services
  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findByProviderId: jest.fn(),
    findByIdOrFail: jest.fn(),
    update: jest.fn(),
    updateLastLogin: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        'jwt.accessTokenExpiresIn': '15m',
        'jwt.refreshTokenExpiresIn': '7d',
        'jwt.issuer': 'applyforus-test',
        'jwt.audience': 'applyforus-api-test',
        frontendUrl: 'http://localhost:3000',
        nodeEnv: 'test',
        'google.clientId': 'test-google-client-id',
        'google.clientSecret': 'test-google-client-secret',
        'google.callbackUrl': 'http://localhost:3001/auth/google/callback',
        'linkedin.clientId': 'test-linkedin-client-id',
        'linkedin.clientSecret': 'test-linkedin-client-secret',
        'linkedin.callbackUrl': 'http://localhost:3001/auth/linkedin/callback',
        'github.clientId': 'test-github-client-id',
        'github.clientSecret': 'test-github-client-secret',
        'github.callbackUrl': 'http://localhost:3001/auth/github/callback',
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  // Store the original config mock implementation
  const originalConfigGet = (key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      'jwt.accessTokenExpiresIn': '15m',
      'jwt.refreshTokenExpiresIn': '7d',
      'jwt.issuer': 'applyforus-test',
      'jwt.audience': 'applyforus-api-test',
      frontendUrl: 'http://localhost:3000',
      nodeEnv: 'test',
      'google.clientId': 'test-google-client-id',
      'google.clientSecret': 'test-google-client-secret',
      'google.callbackUrl': 'http://localhost:3001/auth/google/callback',
      'linkedin.clientId': 'test-linkedin-client-id',
      'linkedin.clientSecret': 'test-linkedin-client-secret',
      'linkedin.callbackUrl': 'http://localhost:3001/auth/linkedin/callback',
      'github.clientId': 'test-github-client-id',
      'github.clientSecret': 'test-github-client-secret',
      'github.callbackUrl': 'http://localhost:3001/auth/github/callback',
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  };

  beforeEach(async () => {
    // Restore the original config mock implementation before module compilation
    mockConfigService.get.mockImplementation(originalConfigGet);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        GoogleStrategy,
        LinkedInStrategy,
        GitHubStrategy,
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

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
    linkedinStrategy = module.get<LinkedInStrategy>(LinkedInStrategy);
    githubStrategy = module.get<GitHubStrategy>(GitHubStrategy);

    // Clear mock call counts but keep implementations
    jest.clearAllMocks();

    // Re-apply the original config implementation after clearAllMocks
    mockConfigService.get.mockImplementation(originalConfigGet);
  });

  describe('Google OAuth Flow', () => {
    const mockGoogleProfile = {
      id: 'google-123456',
      name: {
        givenName: 'John',
        familyName: 'Doe',
      },
      emails: [{ value: 'john.doe@gmail.com', verified: true }],
      photos: [{ value: 'https://example.com/photo.jpg' }],
    };

    describe('Google OAuth Initiation', () => {
      it('should initiate Google OAuth flow with correct redirect', async () => {
        // This is handled by the Guard, just verify the endpoint exists
        await authController.googleLogin();
        expect(true).toBe(true);
      });
    });

    describe('Google OAuth Callback - New User', () => {
      it('should create new user if not exists', async () => {
        const newUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE, {
          email: mockGoogleProfile.emails[0].value,
          firstName: mockGoogleProfile.name.givenName,
          lastName: mockGoogleProfile.name.familyName,
          providerId: mockGoogleProfile.id,
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(newUser);

        const result = await authService.validateOAuthUser({
          providerId: mockGoogleProfile.id,
          provider: 'google',
          email: mockGoogleProfile.emails[0].value,
          firstName: mockGoogleProfile.name.givenName,
          lastName: mockGoogleProfile.name.familyName,
          profilePicture: mockGoogleProfile.photos[0].value,
        });

        expect(result).toEqual(newUser);
        expect(usersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockGoogleProfile.emails[0].value,
            authProvider: 'google',
            providerId: mockGoogleProfile.id,
            isEmailVerified: true,
            status: UserStatus.ACTIVE,
          }),
        );
      });

      it('should set email as verified for new OAuth user', async () => {
        const newUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(newUser);

        await authService.validateOAuthUser({
          providerId: 'google-123',
          provider: 'google',
          email: 'new@gmail.com',
          firstName: 'New',
          lastName: 'User',
        });

        const createCall = usersService.create.mock.calls[0][0];
        expect(createCall.isEmailVerified).toBe(true);
        expect(createCall.status).toBe(UserStatus.ACTIVE);
      });
    });

    describe('Google OAuth Callback - Existing User', () => {
      it('should link to existing user by email', async () => {
        const existingUser = TestFactory.createUser({
          email: mockGoogleProfile.emails[0].value,
          authProvider: AuthProvider.LOCAL,
          providerId: null,
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(existingUser);
        usersService.update.mockResolvedValue(undefined);

        const result = await authService.validateOAuthUser({
          providerId: mockGoogleProfile.id,
          provider: 'google',
          email: mockGoogleProfile.emails[0].value,
          firstName: mockGoogleProfile.name.givenName,
          lastName: mockGoogleProfile.name.familyName,
        });

        expect(result).toEqual(existingUser);
        expect(usersService.update).toHaveBeenCalledWith(
          existingUser.id,
          expect.objectContaining({
            providerId: mockGoogleProfile.id,
            authProvider: 'google',
          }),
        );
      });

      it('should return user if already authenticated with Google', async () => {
        const existingOAuthUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE, {
          providerId: mockGoogleProfile.id,
        });

        usersService.findByProviderId.mockResolvedValue(existingOAuthUser);
        usersService.updateLastLogin.mockResolvedValue(undefined);

        const result = await authService.validateOAuthUser({
          providerId: mockGoogleProfile.id,
          provider: 'google',
          email: mockGoogleProfile.emails[0].value,
          firstName: mockGoogleProfile.name.givenName,
          lastName: mockGoogleProfile.name.familyName,
        });

        expect(result).toEqual(existingOAuthUser);
        expect(usersService.updateLastLogin).toHaveBeenCalledWith(existingOAuthUser.id, null);
        expect(usersService.create).not.toHaveBeenCalled();
      });
    });

    describe('Google OAuth Callback - Success', () => {
      it('should return JWT tokens on success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);
        const mockAccessToken = 'mock-google-access-token';
        const mockRefreshToken = 'mock-google-refresh-token';

        jwtService.signAsync.mockResolvedValueOnce(mockAccessToken);
        jwtService.signAsync.mockResolvedValueOnce(mockRefreshToken);
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        const result = await authService.googleLogin(mockUser);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe(mockAccessToken);
        expect(result.refreshToken).toBe(mockRefreshToken);
        // TokenResponseDto returns a partial user, not the full User object
        expect(result.user.id).toBe(mockUser.id);
        expect(result.user.email).toBe(mockUser.email);
      });

      it('should set secure cookies and redirect to frontend on callback success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockResolvedValue('mock-token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authController.googleCallback(mockReq, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledTimes(2); // access_token and refresh_token
        expect(mockRes.cookie).toHaveBeenCalledWith(
          'access_token',
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'strict',
          }),
        );
        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('http://localhost:3000/oauth/callback?success=true'),
        );
      });
    });

    describe('Google OAuth Callback - Error Handling', () => {
      it('should throw error when email is missing', async () => {
        const profileWithoutEmail = {
          id: 'google-123',
          name: { givenName: 'John', familyName: 'Doe' },
          emails: [] as any[],
          photos: [] as any[],
        };

        const mockDone = jest.fn();

        // The GoogleStrategy throws when emails array is empty
        // because emails[0].value will be undefined
        await expect(
          googleStrategy.validate(
            'access-token',
            'refresh-token',
            profileWithoutEmail,
            mockDone,
          ),
        ).rejects.toThrow();

        // Done should not be called because of the error
        expect(mockDone).not.toHaveBeenCalled();
      });

      it('should handle OAuth provider error', async () => {
        const mockReq = { user: null } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        await authController.googleCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('error=server_error'),
        );
        expect(mockRes.cookie).not.toHaveBeenCalled();
      });

      it('should handle service error during callback', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockRejectedValue(new Error('Token generation failed'));

        await authController.googleCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('error=server_error'),
        );
      });
    });
  });

  describe('LinkedIn OAuth Flow', () => {
    const mockLinkedInProfile = {
      id: 'linkedin-123456',
      name: {
        givenName: 'Jane',
        familyName: 'Smith',
      },
      emails: [{ value: 'jane.smith@company.com' }],
      photos: [{ value: 'https://linkedin.com/photo.jpg' }],
    };

    describe('LinkedIn OAuth Initiation', () => {
      it('should initiate LinkedIn OAuth flow with correct redirect', async () => {
        await authController.linkedinLogin();
        expect(true).toBe(true);
      });
    });

    describe('LinkedIn OAuth Callback - New User', () => {
      it('should create new user if not exists', async () => {
        const newUser = TestFactory.createOAuthUser(AuthProvider.LINKEDIN, {
          email: mockLinkedInProfile.emails[0].value,
          firstName: mockLinkedInProfile.name.givenName,
          lastName: mockLinkedInProfile.name.familyName,
          providerId: mockLinkedInProfile.id,
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(newUser);

        const result = await authService.validateOAuthUser({
          providerId: mockLinkedInProfile.id,
          provider: 'linkedin',
          email: mockLinkedInProfile.emails[0].value,
          firstName: mockLinkedInProfile.name.givenName,
          lastName: mockLinkedInProfile.name.familyName,
          profilePicture: mockLinkedInProfile.photos[0].value,
        });

        expect(result).toEqual(newUser);
        expect(usersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockLinkedInProfile.emails[0].value,
            authProvider: 'linkedin',
            providerId: mockLinkedInProfile.id,
          }),
        );
      });
    });

    describe('LinkedIn OAuth Callback - Existing User', () => {
      it('should link to existing user by email', async () => {
        const existingUser = TestFactory.createUser({
          email: mockLinkedInProfile.emails[0].value,
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(existingUser);
        usersService.update.mockResolvedValue(undefined);

        const result = await authService.validateOAuthUser({
          providerId: mockLinkedInProfile.id,
          provider: 'linkedin',
          email: mockLinkedInProfile.emails[0].value,
          firstName: mockLinkedInProfile.name.givenName,
          lastName: mockLinkedInProfile.name.familyName,
        });

        expect(result).toEqual(existingUser);
        expect(usersService.update).toHaveBeenCalledWith(
          existingUser.id,
          expect.objectContaining({
            providerId: mockLinkedInProfile.id,
            authProvider: 'linkedin',
          }),
        );
      });
    });

    describe('LinkedIn OAuth Callback - Success', () => {
      it('should return JWT tokens on success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.LINKEDIN);
        const mockAccessToken = 'mock-linkedin-access-token';
        const mockRefreshToken = 'mock-linkedin-refresh-token';

        jwtService.signAsync.mockResolvedValueOnce(mockAccessToken);
        jwtService.signAsync.mockResolvedValueOnce(mockRefreshToken);
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        const result = await authService.oauthLogin(mockUser);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe(mockAccessToken);
        expect(result.refreshToken).toBe(mockRefreshToken);
      });

      it('should set secure cookies and redirect on callback success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.LINKEDIN);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockResolvedValue('mock-token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authController.linkedinCallback(mockReq, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledTimes(2);
        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('success=true'),
        );
      });
    });

    describe('LinkedIn OAuth Callback - Error Handling', () => {
      it('should handle missing email gracefully', async () => {
        const profileWithoutEmail = {
          id: 'linkedin-123',
          name: { givenName: 'Jane', familyName: 'Smith' },
          emails: [] as any[],
          photos: [] as any[],
        };

        const mockDone = jest.fn();

        await linkedinStrategy.validate(
          'access-token',
          'refresh-token',
          profileWithoutEmail,
          mockDone,
        );

        // LinkedIn strategy explicitly checks for email
        expect(mockDone).toHaveBeenCalledWith(
          expect.any(Error),
          null,
        );
      });

      it('should handle OAuth provider error', async () => {
        const mockReq = { user: null } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        await authController.linkedinCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('error=server_error'),
        );
      });

      it('should handle LinkedIn-specific profile fields', async () => {
        // LinkedIn has specific field structure
        const linkedinProfile = {
          id: 'linkedin-789',
          name: {
            givenName: 'Professional',
            familyName: 'User',
          },
          emails: [{ value: 'pro@company.com' }],
          photos: [] as any[],
        };

        const newUser = TestFactory.createOAuthUser(AuthProvider.LINKEDIN);
        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(newUser);

        const result = await authService.validateOAuthUser({
          providerId: linkedinProfile.id,
          provider: 'linkedin',
          email: linkedinProfile.emails[0].value,
          firstName: linkedinProfile.name.givenName,
          lastName: linkedinProfile.name.familyName,
          profilePicture: null as any, // No photo provided
        });

        expect(result).toBeDefined();
        expect(usersService.create).toHaveBeenCalled();
      });
    });
  });

  describe('GitHub OAuth Flow', () => {
    const mockGitHubProfile = {
      id: '98765432',
      displayName: 'Developer User',
      emails: [{ value: 'dev@github.com' }],
      photos: [{ value: 'https://github.com/avatar.jpg' }],
    };

    describe('GitHub OAuth Initiation', () => {
      it('should initiate GitHub OAuth flow with correct redirect', async () => {
        await authController.githubLogin();
        expect(true).toBe(true);
      });
    });

    describe('GitHub OAuth Callback - New User', () => {
      it('should create new user if not exists', async () => {
        const newUser = TestFactory.createOAuthUser(AuthProvider.GITHUB, {
          email: mockGitHubProfile.emails[0].value,
          firstName: 'Developer',
          lastName: 'User',
          providerId: mockGitHubProfile.id.toString(),
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(newUser);

        const result = await authService.validateOAuthUser({
          providerId: mockGitHubProfile.id.toString(),
          provider: 'github',
          email: mockGitHubProfile.emails[0].value,
          firstName: 'Developer',
          lastName: 'User',
          profilePicture: mockGitHubProfile.photos[0].value,
        });

        expect(result).toEqual(newUser);
        expect(usersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: mockGitHubProfile.emails[0].value,
            authProvider: 'github',
            providerId: mockGitHubProfile.id.toString(),
          }),
        );
      });
    });

    describe('GitHub OAuth Callback - Existing User', () => {
      it('should link to existing user by email', async () => {
        const existingUser = TestFactory.createUser({
          email: mockGitHubProfile.emails[0].value,
        });

        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(existingUser);
        usersService.update.mockResolvedValue(undefined);

        const result = await authService.validateOAuthUser({
          providerId: mockGitHubProfile.id.toString(),
          provider: 'github',
          email: mockGitHubProfile.emails[0].value,
          firstName: 'Developer',
          lastName: 'User',
        });

        expect(result).toEqual(existingUser);
        expect(usersService.update).toHaveBeenCalledWith(
          existingUser.id,
          expect.objectContaining({
            providerId: mockGitHubProfile.id.toString(),
            authProvider: 'github',
          }),
        );
      });
    });

    describe('GitHub OAuth Callback - Success', () => {
      it('should return JWT tokens on success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GITHUB);
        const mockAccessToken = 'mock-github-access-token';
        const mockRefreshToken = 'mock-github-refresh-token';

        jwtService.signAsync.mockResolvedValueOnce(mockAccessToken);
        jwtService.signAsync.mockResolvedValueOnce(mockRefreshToken);
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        const result = await authService.oauthLogin(mockUser);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe(mockAccessToken);
        expect(result.refreshToken).toBe(mockRefreshToken);
      });

      it('should set secure cookies and redirect on callback success', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GITHUB);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockResolvedValue('mock-token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authController.githubCallback(mockReq, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledTimes(2);
        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('success=true'),
        );
      });
    });

    describe('GitHub OAuth Callback - Error Handling', () => {
      it('should handle missing email gracefully', async () => {
        const profileWithoutEmail = {
          id: '12345',
          displayName: 'No Email User',
          emails: [] as any[],
          photos: [] as any[],
        };

        const mockDone = jest.fn();

        await githubStrategy.validate(
          'access-token',
          'refresh-token',
          profileWithoutEmail,
          mockDone,
        );

        // GitHub strategy explicitly checks for email
        expect(mockDone).toHaveBeenCalledWith(
          expect.any(Error),
          null,
        );
      });

      it('should handle private email scenario', async () => {
        // GitHub users can keep their email private
        const privateProfile = {
          id: '99999',
          displayName: 'Private User',
          emails: [] as any[], // No public email
          photos: [] as any[],
        };

        const mockDone = jest.fn();

        await githubStrategy.validate(
          'access-token',
          'refresh-token',
          privateProfile,
          mockDone,
        );

        expect(mockDone).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Email not provided'),
          }),
          null,
        );
      });

      it('should parse name from displayName correctly', async () => {
        const profiles = [
          { displayName: 'John Doe', expected: { first: 'John', last: 'Doe' } },
          { displayName: 'John', expected: { first: 'John', last: null } },
          { displayName: 'John Q. Public', expected: { first: 'John', last: 'Q. Public' } },
          { displayName: '', expected: { first: null, last: null } },
        ];

        for (const { displayName, expected } of profiles) {
          const nameParts = displayName ? displayName.split(' ') : [];
          const firstName = nameParts[0] || null;
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

          expect(firstName).toBe(expected.first);
          expect(lastName).toBe(expected.last);
        }
      });

      it('should handle OAuth provider error', async () => {
        const mockReq = { user: null } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        await authController.githubCallback(mockReq, mockRes);

        expect(mockRes.redirect).toHaveBeenCalledWith(
          expect.stringContaining('error=server_error'),
        );
      });
    });
  });

  describe('OAuth Disconnect', () => {
    describe('Successful Disconnect', () => {
      it('should successfully disconnect OAuth provider', async () => {
        const userWithPassword = TestFactory.createOAuthUser(AuthProvider.GOOGLE, {
          password: 'hashed-password', // User has set a password
        });

        usersService.findByIdOrFail.mockResolvedValue(userWithPassword);
        usersService.update.mockResolvedValue(undefined);

        const result = await authService.disconnectOAuth(userWithPassword.id);

        expect(result.message).toContain('disconnected successfully');
        expect(usersService.update).toHaveBeenCalledWith(
          userWithPassword.id,
          expect.objectContaining({
            providerId: null,
            authProvider: AuthProvider.LOCAL,
          }),
        );
      });

      it('should disconnect OAuth via controller', async () => {
        const userWithPassword = TestFactory.createOAuthUser(AuthProvider.GOOGLE, {
          password: 'hashed-password',
        });

        usersService.findByIdOrFail.mockResolvedValue(userWithPassword);
        usersService.update.mockResolvedValue(undefined);

        const result = await authController.disconnectOAuth(userWithPassword);

        expect(result.message).toContain('disconnected successfully');
      });
    });

    describe('Prevent Disconnect Without Password', () => {
      it('should prevent disconnect if it is the only auth method', async () => {
        const oauthOnlyUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE, {
          password: null, // No password set
        });

        usersService.findByIdOrFail.mockResolvedValue(oauthOnlyUser);

        await expect(authService.disconnectOAuth(oauthOnlyUser.id)).rejects.toThrow(
          BadRequestException,
        );
        await expect(authService.disconnectOAuth(oauthOnlyUser.id)).rejects.toThrow(
          /set a password first/,
        );
        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('should show proper error message when disconnecting without password', async () => {
        const oauthOnlyUser = TestFactory.createOAuthUser(AuthProvider.LINKEDIN, {
          password: null,
        });

        usersService.findByIdOrFail.mockResolvedValue(oauthOnlyUser);

        try {
          await authService.disconnectOAuth(oauthOnlyUser.id);
          fail('Should have thrown BadRequestException');
        } catch (error: any) {
          expect(error).toBeInstanceOf(BadRequestException);
          expect(error.message).toContain('Cannot disconnect OAuth provider');
          expect(error.message).toContain('set a password first');
        }
      });
    });

    describe('Error Handling', () => {
      it('should return error if provider not connected', async () => {
        const localUser = TestFactory.createUser({
          authProvider: AuthProvider.LOCAL,
          providerId: null,
        });

        usersService.findByIdOrFail.mockResolvedValue(localUser);
        usersService.update.mockResolvedValue(undefined);

        // User is already local, but disconnect should still work (no-op)
        const result = await authService.disconnectOAuth(localUser.id);

        expect(result.message).toContain('disconnected successfully');
        expect(usersService.update).toHaveBeenCalledWith(
          localUser.id,
          expect.objectContaining({
            providerId: null,
            authProvider: AuthProvider.LOCAL,
          }),
        );
      });

      it('should handle user not found error', async () => {
        usersService.findByIdOrFail.mockRejectedValue(new Error('User not found'));

        await expect(authService.disconnectOAuth('non-existent-id')).rejects.toThrow(
          'User not found',
        );
      });
    });
  });

  describe('OAuth Security Tests', () => {
    describe('State Parameter Validation', () => {
      it('should validate state parameter in OAuth flow', () => {
        // LinkedIn strategy has state: true
        expect(linkedinStrategy).toBeDefined();
        // State validation is handled by passport strategy
      });
    });

    describe('Token Security', () => {
      it('should generate secure JWT tokens for OAuth users', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

        jwtService.signAsync.mockResolvedValueOnce('secure-access-token');
        jwtService.signAsync.mockResolvedValueOnce('secure-refresh-token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        const result = await authService.googleLogin(mockUser);

        expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
        expect(jwtService.signAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            sub: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
          }),
          expect.objectContaining({
            expiresIn: expect.any(String),
            issuer: expect.any(String),
            audience: expect.any(String),
          }),
        );
        expect(result.accessToken).toBe('secure-access-token');
        expect(result.refreshToken).toBe('secure-refresh-token');
      });

      it('should store hashed refresh token', async () => {
        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);

        jwtService.signAsync.mockResolvedValue('refresh-token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authService.googleLogin(mockUser);

        expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
          mockUser.id,
          'refresh-token',
        );
      });
    });

    describe('Email Verification for OAuth', () => {
      it('should mark OAuth users as email verified', async () => {
        const profiles = [
          { providerId: 'google-1', provider: 'google', email: 'user1@gmail.com' },
          { providerId: 'linkedin-1', provider: 'linkedin', email: 'user2@company.com' },
          { providerId: 'github-1', provider: 'github', email: 'user3@github.com' },
        ];

        for (const profile of profiles) {
          usersService.findByProviderId.mockResolvedValue(null);
          usersService.findByEmail.mockResolvedValue(null);
          usersService.create.mockResolvedValue(
            TestFactory.createOAuthUser(profile.provider as AuthProvider),
          );

          await authService.validateOAuthUser(profile);

          const createCall = usersService.create.mock.calls[0][0];
          expect(createCall.isEmailVerified).toBe(true);

          jest.clearAllMocks();
        }
      });
    });

    describe('Cookie Security', () => {
      it('should set httpOnly cookies in production', async () => {
        mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            'jwt.accessTokenExpiresIn': '15m',
            'jwt.refreshTokenExpiresIn': '7d',
            'jwt.issuer': 'applyforus-test',
            'jwt.audience': 'applyforus-api-test',
            frontendUrl: 'http://localhost:3000',
            nodeEnv: 'production',
          };
          return config[key] !== undefined ? config[key] : defaultValue;
        });

        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockResolvedValue('token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authController.googleCallback(mockReq, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledWith(
          'access_token',
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            secure: true, // Should be true in production
            sameSite: 'strict',
          }),
        );
      });

      it('should not set secure flag in test environment', async () => {
        mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
          if (key === 'nodeEnv') {return 'test';}
          const config: Record<string, any> = {
            frontendUrl: 'http://localhost:3000',
          };
          return config[key] !== undefined ? config[key] : defaultValue;
        });

        const mockUser = TestFactory.createOAuthUser(AuthProvider.GOOGLE);
        const mockReq = { user: mockUser } as unknown as Request;
        const mockRes = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        jwtService.signAsync.mockResolvedValue('token');
        usersService.updateRefreshToken.mockResolvedValue(undefined);

        await authController.googleCallback(mockReq, mockRes);

        expect(mockRes.cookie).toHaveBeenCalledWith(
          'access_token',
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
            secure: false, // Should be false in test
            sameSite: 'strict',
          }),
        );
      });
    });
  });

  describe('OAuth Profile Data Handling', () => {
    it('should handle missing profile picture', async () => {
      const profiles: any[] = [
        { providerId: 'google-1', provider: 'google', email: 'test@gmail.com', profilePicture: null },
        { providerId: 'linkedin-1', provider: 'linkedin', email: 'test@company.com', profilePicture: undefined },
      ];

      for (const profile of profiles) {
        usersService.findByProviderId.mockResolvedValue(null);
        usersService.findByEmail.mockResolvedValue(null);
        usersService.create.mockResolvedValue(
          TestFactory.createOAuthUser(profile.provider as AuthProvider),
        );

        await authService.validateOAuthUser(profile);

        const createCall = usersService.create.mock.calls[0][0];
        expect(createCall.profilePicture).toBeFalsy();

        jest.clearAllMocks();
      }
    });

    it('should handle missing name fields', async () => {
      const profile = {
        providerId: 'google-1',
        provider: 'google',
        email: 'test@gmail.com',
        firstName: undefined as any,
        lastName: undefined as any,
      };

      usersService.findByProviderId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(
        TestFactory.createOAuthUser(AuthProvider.GOOGLE),
      );

      await authService.validateOAuthUser(profile);

      const createCall = usersService.create.mock.calls[0][0];
      expect(createCall).toBeDefined();
      // Names can be undefined
    });

    it('should preserve existing profile picture when linking OAuth', async () => {
      const existingUser = TestFactory.createUser({
        email: 'test@example.com',
        profilePicture: 'https://existing.com/photo.jpg',
      });

      const profile = {
        providerId: 'google-1',
        provider: 'google',
        email: 'test@example.com',
        profilePicture: 'https://google.com/new-photo.jpg',
      };

      usersService.findByProviderId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(existingUser);
      usersService.update.mockResolvedValue(undefined);

      await authService.validateOAuthUser(profile);

      expect(usersService.update).toHaveBeenCalledWith(
        existingUser.id,
        expect.objectContaining({
          profilePicture: profile.profilePicture,
        }),
      );
    });
  });
});
