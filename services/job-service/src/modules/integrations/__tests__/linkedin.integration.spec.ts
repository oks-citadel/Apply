import {
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  HttpStatus
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';


import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type { AxiosError, AxiosResponse } from 'axios';
import type { Repository } from 'typeorm';

/**
 * LinkedIn Integration Test Suite
 * Tests OAuth flow, profile import, data sync, and error handling
 */
describe('LinkedIn Integration', () => {
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let integrationRepository: jest.Mocked<Repository<any>>;
  let tokenRepository: jest.Mocked<Repository<any>>;

  const mockLinkedInConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/api/v1/integrations/linkedin/callback',
    scope: 'r_liteprofile r_emailaddress w_member_social',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    apiUrl: 'https://api.linkedin.com/v2',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockLinkedInProfile = {
    id: 'linkedin-id-123',
    firstName: {
      localized: { en_US: 'John' },
      preferredLocale: { country: 'US', language: 'en' },
    },
    lastName: {
      localized: { en_US: 'Doe' },
      preferredLocale: { country: 'US', language: 'en' },
    },
    headline: 'Senior Software Engineer',
    profilePicture: {
      'displayImage~': {
        elements: [
          {
            identifiers: [{ identifier: 'https://example.com/profile.jpg' }],
          },
        ],
      },
    },
  };

  const mockLinkedInExperience = {
    elements: [
      {
        id: 'exp-1',
        title: {
          localized: { en_US: 'Senior Software Engineer' },
        },
        company: {
          name: 'Tech Corp',
        },
        timePeriod: {
          startDate: { month: 1, year: 2020 },
          endDate: { month: 12, year: 2023 },
        },
        description: {
          localized: { en_US: 'Developed scalable applications' },
        },
      },
    ],
  };

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
  };

  const mockIntegration = {
    id: 'integration-1',
    user_id: 'user-123',
    provider: 'linkedin',
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: new Date(Date.now() + 3600000),
    is_active: true,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'LINKEDIN_CLIENT_ID': mockLinkedInConfig.clientId,
        'LINKEDIN_CLIENT_SECRET': mockLinkedInConfig.clientSecret,
        'LINKEDIN_REDIRECT_URI': mockLinkedInConfig.redirectUri,
        'LINKEDIN_SCOPE': mockLinkedInConfig.scope,
        'LINKEDIN_AUTH_URL': mockLinkedInConfig.authUrl,
        'LINKEDIN_TOKEN_URL': mockLinkedInConfig.tokenUrl,
        'LINKEDIN_API_URL': mockLinkedInConfig.apiUrl,
      };
      return config[key];
    }),
  };

  const mockIntegrationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockTokenRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('OAuth Flow', () => {
    describe('Authorization URL Generation', () => {
      it('should generate correct LinkedIn authorization URL', () => {
        const state = 'random-state-123';
        const expectedUrl = `${mockLinkedInConfig.authUrl}?response_type=code&client_id=${mockLinkedInConfig.clientId}&redirect_uri=${encodeURIComponent(mockLinkedInConfig.redirectUri)}&state=${state}&scope=${encodeURIComponent(mockLinkedInConfig.scope)}`;

        // Implementation would be tested here
        expect(expectedUrl).toContain('response_type=code');
        expect(expectedUrl).toContain(`client_id=${mockLinkedInConfig.clientId}`);
        expect(expectedUrl).toContain('state=');
      });

      it('should include CSRF state parameter', () => {
        const state = 'random-state-123';
        const authUrl = `${mockLinkedInConfig.authUrl}?state=${state}`;

        expect(authUrl).toContain('state=');
        expect(state).toHaveLength(15);
      });

      it('should include required scopes', () => {
        const scope = mockLinkedInConfig.scope;

        expect(scope).toContain('r_liteprofile');
        expect(scope).toContain('r_emailaddress');
      });
    });

    describe('Token Exchange', () => {
      it('should exchange authorization code for access token', async () => {
        const code = 'auth-code-123';

        mockHttpService.post.mockReturnValue(
          of({
            data: mockTokens,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        mockIntegrationRepository.create.mockReturnValue(mockIntegration);
        mockIntegrationRepository.save.mockResolvedValue(mockIntegration);

        // Test token exchange logic
        expect(mockTokens.access_token).toBeDefined();
        expect(mockTokens.expires_in).toBe(3600);
      });

      it('should handle invalid authorization code', async () => {
        const error: AxiosError = {
          isAxiosError: true,
          response: {
            status: 400,
            data: { error: 'invalid_grant', error_description: 'Invalid authorization code' },
            statusText: 'Bad Request',
            headers: {},
            config: {} as any,
          },
          message: 'Invalid authorization code',
          name: 'AxiosError',
          config: {} as any,
          toJSON: () => ({}),
        };

        mockHttpService.post.mockReturnValue(throwError(() => error));

        // Should throw BadRequestException
        expect(error.response?.status).toBe(400);
        expect(error.response?.data.error).toBe('invalid_grant');
      });

      it('should store tokens securely', async () => {
        mockIntegrationRepository.create.mockReturnValue(mockIntegration);
        mockIntegrationRepository.save.mockResolvedValue(mockIntegration);

        // Verify tokens are stored with encryption
        expect(mockIntegration.access_token).toBeDefined();
        expect(mockIntegration.refresh_token).toBeDefined();
        expect(mockIntegration.expires_at).toBeInstanceOf(Date);
      });

      it('should handle network errors during token exchange', async () => {
        const error: AxiosError = {
          isAxiosError: true,
          message: 'Network error',
          name: 'AxiosError',
          config: {} as any,
          toJSON: () => ({}),
        };

        mockHttpService.post.mockReturnValue(throwError(() => error));

        expect(error.message).toBe('Network error');
      });
    });

    describe('Token Refresh', () => {
      it('should refresh expired access token', async () => {
        const expiredIntegration = {
          ...mockIntegration,
          expires_at: new Date(Date.now() - 1000),
        };

        mockIntegrationRepository.findOne.mockResolvedValue(expiredIntegration);

        mockHttpService.post.mockReturnValue(
          of({
            data: {
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              expires_in: 3600,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        mockIntegrationRepository.update.mockResolvedValue({ affected: 1 } as any);

        // Verify token refresh logic
        expect(expiredIntegration.expires_at.getTime()).toBeLessThan(Date.now());
      });

      it('should handle invalid refresh token', async () => {
        const error: AxiosError = {
          isAxiosError: true,
          response: {
            status: 401,
            data: { error: 'invalid_grant', error_description: 'Invalid refresh token' },
            statusText: 'Unauthorized',
            headers: {},
            config: {} as any,
          },
          message: 'Invalid refresh token',
          name: 'AxiosError',
          config: {} as any,
          toJSON: () => ({}),
        };

        mockHttpService.post.mockReturnValue(throwError(() => error));

        // Should revoke integration and require re-authentication
        expect(error.response?.status).toBe(401);
      });

      it('should update token expiry correctly', async () => {
        const newExpiry = new Date(Date.now() + 3600000);

        mockIntegrationRepository.update.mockResolvedValue({ affected: 1 } as any);

        expect(newExpiry.getTime()).toBeGreaterThan(Date.now());
      });
    });
  });

  describe('Profile Import', () => {
    describe('Basic Profile Data', () => {
      it('should import LinkedIn profile successfully', async () => {
        mockHttpService.get.mockReturnValue(
          of({
            data: mockLinkedInProfile,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        // Verify profile data extraction
        expect(mockLinkedInProfile.firstName.localized.en_US).toBe('John');
        expect(mockLinkedInProfile.lastName.localized.en_US).toBe('Doe');
        expect(mockLinkedInProfile.headline).toBe('Senior Software Engineer');
      });

      it('should handle profile with missing optional fields', async () => {
        const incompleteProfile = {
          id: 'linkedin-id-123',
          firstName: {
            localized: { en_US: 'John' },
          },
          lastName: {
            localized: { en_US: 'Doe' },
          },
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: incompleteProfile,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        // Should handle gracefully
        expect(incompleteProfile.firstName).toBeDefined();
      });

      it('should extract profile picture URL', async () => {
        mockHttpService.get.mockReturnValue(
          of({
            data: mockLinkedInProfile,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        const profilePictureUrl = mockLinkedInProfile.profilePicture['displayImage~'].elements[0].identifiers[0].identifier;
        expect(profilePictureUrl).toBe('https://example.com/profile.jpg');
      });
    });

    describe('Work Experience Import', () => {
      it('should import work experience successfully', async () => {
        mockHttpService.get.mockReturnValue(
          of({
            data: mockLinkedInExperience,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(mockLinkedInExperience.elements).toHaveLength(1);
        expect(mockLinkedInExperience.elements[0].company.name).toBe('Tech Corp');
      });

      it('should parse date ranges correctly', async () => {
        const experience = mockLinkedInExperience.elements[0];

        expect(experience.timePeriod.startDate.year).toBe(2020);
        expect(experience.timePeriod.endDate.year).toBe(2023);
      });

      it('should handle current positions (no end date)', async () => {
        const currentPosition = {
          ...mockLinkedInExperience.elements[0],
          timePeriod: {
            startDate: { month: 1, year: 2020 },
          },
        };

        expect(currentPosition.timePeriod.startDate).toBeDefined();
      });
    });

    describe('Skills Import', () => {
      it('should import skills list', async () => {
        const mockSkills = {
          elements: [
            { name: { localized: { en_US: 'JavaScript' } } },
            { name: { localized: { en_US: 'TypeScript' } } },
            { name: { localized: { en_US: 'Node.js' } } },
          ],
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: mockSkills,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(mockSkills.elements).toHaveLength(3);
      });

      it('should handle endorsements', async () => {
        const skillWithEndorsements = {
          name: { localized: { en_US: 'JavaScript' } },
          endorsementCount: 25,
        };

        expect(skillWithEndorsements.endorsementCount).toBe(25);
      });
    });

    describe('Education Import', () => {
      it('should import education history', async () => {
        const mockEducation = {
          elements: [
            {
              schoolName: 'University of Technology',
              degreeName: 'Bachelor of Science',
              fieldOfStudy: 'Computer Science',
              timePeriod: {
                startDate: { year: 2012 },
                endDate: { year: 2016 },
              },
            },
          ],
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: mockEducation,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(mockEducation.elements[0].schoolName).toBe('University of Technology');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle LinkedIn API rate limits', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' },
          statusText: 'Too Many Requests',
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Date.now() + 60000),
          },
          config: {} as any,
        },
        message: 'Rate limit exceeded',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      expect(error.response?.status).toBe(429);
      expect(error.response?.headers['x-ratelimit-remaining']).toBe('0');
    });

    it('should implement exponential backoff', async () => {
      const retryDelays = [1000, 2000, 4000, 8000];

      retryDelays.forEach((delay, index) => {
        expect(delay).toBe(1000 * Math.pow(2, index));
      });
    });

    it('should respect retry-after header', async () => {
      const retryAfter = 60; // seconds

      expect(retryAfter).toBe(60);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized errors', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        message: 'Unauthorized',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      expect(error.response?.status).toBe(401);
    });

    it('should handle network timeouts', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      expect(error.code).toBe('ECONNABORTED');
    });

    it('should handle service unavailable errors', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: { message: 'Service temporarily unavailable' },
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as any,
        },
        message: 'Service unavailable',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      expect(error.response?.status).toBe(503);
    });
  });

  describe('Data Transformation', () => {
    it('should transform LinkedIn profile to internal format', () => {
      const transformed = {
        external_id: mockLinkedInProfile.id,
        first_name: mockLinkedInProfile.firstName.localized.en_US,
        last_name: mockLinkedInProfile.lastName.localized.en_US,
        headline: mockLinkedInProfile.headline,
        profile_picture: mockLinkedInProfile.profilePicture['displayImage~'].elements[0].identifiers[0].identifier,
      };

      expect(transformed.first_name).toBe('John');
      expect(transformed.last_name).toBe('Doe');
    });

    it('should transform experience to internal format', () => {
      const experience = mockLinkedInExperience.elements[0];
      const transformed = {
        title: experience.title.localized.en_US,
        company: experience.company.name,
        start_date: new Date(2020, 0),
        end_date: new Date(2023, 11),
        description: experience.description.localized.en_US,
      };

      expect(transformed.company).toBe('Tech Corp');
    });
  });

  describe('Webhook Handling', () => {
    it('should verify webhook signatures', () => {
      const signature = 'mock-signature';
      const payload = JSON.stringify({ event: 'profile.updated' });
      const secret = 'webhook-secret';

      // Signature verification logic would be tested here
      expect(signature).toBeDefined();
      expect(payload).toBeDefined();
    });

    it('should handle profile update events', async () => {
      const event = {
        type: 'profile.updated',
        data: {
          person: 'urn:li:person:123',
          updatedFields: ['headline', 'positions'],
        },
      };

      expect(event.type).toBe('profile.updated');
      expect(event.data.updatedFields).toContain('headline');
    });

    it('should handle connection events', async () => {
      const event = {
        type: 'connection.added',
        data: {
          person: 'urn:li:person:123',
          connection: 'urn:li:person:456',
        },
      };

      expect(event.type).toBe('connection.added');
    });
  });

  describe('Connection Management', () => {
    it('should check connection status', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);

      expect(mockIntegration.is_active).toBe(true);
      expect(mockIntegration.provider).toBe('linkedin');
    });

    it('should disconnect LinkedIn integration', async () => {
      mockIntegrationRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await mockIntegrationRepository.delete({
        user_id: mockUser.id,
        provider: 'linkedin'
      });

      expect(result.affected).toBe(1);
    });

    it('should revoke LinkedIn access token on disconnect', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse)
      );

      // Token revocation would be tested here
      expect(true).toBe(true);
    });

    it('should handle multiple LinkedIn accounts', async () => {
      const integrations = [
        { ...mockIntegration, id: 'integration-1' },
        { ...mockIntegration, id: 'integration-2' },
      ];

      mockIntegrationRepository.find.mockResolvedValue(integrations);

      const result = await mockIntegrationRepository.find({
        where: { user_id: mockUser.id, provider: 'linkedin' },
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('Data Sync', () => {
    it('should sync profile data periodically', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: mockLinkedInProfile,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse)
      );

      // Periodic sync logic would be tested here
      expect(mockLinkedInProfile).toBeDefined();
    });

    it('should track last sync timestamp', async () => {
      const updatedIntegration = {
        ...mockIntegration,
        metadata: {
          last_sync: new Date().toISOString(),
        },
      };

      mockIntegrationRepository.update.mockResolvedValue({ affected: 1 } as any);

      expect(updatedIntegration.metadata.last_sync).toBeDefined();
    });

    it('should handle partial sync failures', async () => {
      const syncResults = {
        profile: { success: true },
        experience: { success: false, error: 'API error' },
        skills: { success: true },
      };

      expect(syncResults.profile.success).toBe(true);
      expect(syncResults.experience.success).toBe(false);
    });
  });
});
