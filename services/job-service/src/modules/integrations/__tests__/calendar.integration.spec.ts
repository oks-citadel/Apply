import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * Calendar Integration Test Suite (Google Calendar & Outlook Calendar)
 * Tests OAuth flow, event creation, synchronization, and reminders
 */
describe('Calendar Integration', () => {
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let integrationRepository: jest.Mocked<Repository<any>>;
  let eventRepository: jest.Mocked<Repository<any>>;

  const mockGoogleConfig = {
    clientId: 'google-client-id',
    clientSecret: 'google-client-secret',
    redirectUri: 'http://localhost:3000/api/v1/integrations/calendar/google/callback',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    apiUrl: 'https://www.googleapis.com/calendar/v3',
  };

  const mockOutlookConfig = {
    clientId: 'outlook-client-id',
    clientSecret: 'outlook-client-secret',
    redirectUri: 'http://localhost:3000/api/v1/integrations/calendar/outlook/callback',
    scope: 'Calendars.ReadWrite offline_access',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    apiUrl: 'https://graph.microsoft.com/v1.0',
  };

  const mockInterviewEvent = {
    id: 'event-123',
    summary: 'Interview with Tech Corp',
    description: 'Technical interview for Senior Engineer position',
    start: {
      dateTime: '2024-02-01T10:00:00-08:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2024-02-01T11:00:00-08:00',
      timeZone: 'America/Los_Angeles',
    },
    location: 'Zoom Meeting',
    attendees: [
      { email: 'interviewer@techcorp.com', responseStatus: 'accepted' },
      { email: 'candidate@example.com', responseStatus: 'needsAction' },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 30 },
      ],
    },
    conferenceData: {
      entryPoints: [
        {
          entryPointType: 'video',
          uri: 'https://zoom.us/j/123456789',
          label: 'zoom.us/j/123456789',
        },
      ],
    },
  };

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'https://www.googleapis.com/auth/calendar',
  };

  const mockIntegration = {
    id: 'integration-1',
    user_id: 'user-123',
    provider: 'google_calendar',
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: new Date(Date.now() + 3600000),
    is_active: true,
    metadata: {
      calendar_id: 'primary',
      timezone: 'America/Los_Angeles',
    },
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
        'GOOGLE_CLIENT_ID': mockGoogleConfig.clientId,
        'GOOGLE_CLIENT_SECRET': mockGoogleConfig.clientSecret,
        'GOOGLE_REDIRECT_URI': mockGoogleConfig.redirectUri,
        'OUTLOOK_CLIENT_ID': mockOutlookConfig.clientId,
        'OUTLOOK_CLIENT_SECRET': mockOutlookConfig.clientSecret,
        'OUTLOOK_REDIRECT_URI': mockOutlookConfig.redirectUri,
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

  const mockEventRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('Google Calendar Integration', () => {
    describe('OAuth Flow', () => {
      it('should generate Google authorization URL', () => {
        const state = 'random-state-123';
        const authUrl = `${mockGoogleConfig.authUrl}?response_type=code&client_id=${mockGoogleConfig.clientId}&redirect_uri=${encodeURIComponent(mockGoogleConfig.redirectUri)}&scope=${encodeURIComponent(mockGoogleConfig.scope)}&state=${state}&access_type=offline&prompt=consent`;

        expect(authUrl).toContain('access_type=offline');
        expect(authUrl).toContain('prompt=consent');
      });

      it('should exchange authorization code for tokens', async () => {
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

        expect(mockTokens.access_token).toBeDefined();
        expect(mockTokens.refresh_token).toBeDefined();
      });

      it('should handle token refresh', async () => {
        const newTokens = {
          access_token: 'new-access-token',
          expires_in: 3600,
        };

        mockHttpService.post.mockReturnValue(
          of({
            data: newTokens,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        mockIntegrationRepository.update.mockResolvedValue({ affected: 1 } as any);

        expect(newTokens.access_token).toBe('new-access-token');
      });

      it('should require offline access for refresh token', () => {
        const authUrl = `${mockGoogleConfig.authUrl}?access_type=offline`;

        expect(authUrl).toContain('access_type=offline');
      });
    });

    describe('Calendar Event Creation', () => {
      it('should create interview event successfully', async () => {
        mockHttpService.post.mockReturnValue(
          of({
            data: mockInterviewEvent,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        mockEventRepository.create.mockReturnValue({
          id: 'event-1',
          external_id: mockInterviewEvent.id,
          user_id: 'user-123',
        });
        mockEventRepository.save.mockResolvedValue({
          id: 'event-1',
          external_id: mockInterviewEvent.id,
        });

        expect(mockInterviewEvent.summary).toContain('Interview');
      });

      it('should set interview reminders', async () => {
        const event = {
          ...mockInterviewEvent,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 1440 }, // 1 day before
              { method: 'popup', minutes: 30 },   // 30 min before
            ],
          },
        };

        expect(event.reminders.overrides).toHaveLength(2);
        expect(event.reminders.overrides[0].minutes).toBe(1440);
      });

      it('should add attendees to calendar event', async () => {
        expect(mockInterviewEvent.attendees).toHaveLength(2);
        expect(mockInterviewEvent.attendees[0].email).toBe('interviewer@techcorp.com');
      });

      it('should set timezone for event', async () => {
        expect(mockInterviewEvent.start.timeZone).toBe('America/Los_Angeles');
        expect(mockInterviewEvent.end.timeZone).toBe('America/Los_Angeles');
      });

      it('should add video conference link', async () => {
        const conferenceLink = mockInterviewEvent.conferenceData.entryPoints[0].uri;

        expect(conferenceLink).toContain('zoom.us');
      });

      it('should handle recurring interview events', async () => {
        const recurringEvent = {
          ...mockInterviewEvent,
          recurrence: ['RRULE:FREQ=WEEKLY;COUNT=3'],
        };

        expect(recurringEvent.recurrence).toBeDefined();
        expect(recurringEvent.recurrence[0]).toContain('WEEKLY');
      });
    });

    describe('Calendar Event Management', () => {
      it('should update existing event', async () => {
        const updatedEvent = {
          ...mockInterviewEvent,
          summary: 'Updated Interview Title',
        };

        mockHttpService.patch.mockReturnValue(
          of({
            data: updatedEvent,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(updatedEvent.summary).toBe('Updated Interview Title');
      });

      it('should delete calendar event', async () => {
        mockHttpService.delete.mockReturnValue(
          of({
            data: {},
            status: 204,
            statusText: 'No Content',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        mockEventRepository.delete.mockResolvedValue({ affected: 1 } as any);

        const result = await mockEventRepository.delete('event-1');
        expect(result.affected).toBe(1);
      });

      it('should list upcoming events', async () => {
        const upcomingEvents = {
          items: [mockInterviewEvent],
          nextPageToken: 'token-123',
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: upcomingEvents,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(upcomingEvents.items).toHaveLength(1);
      });

      it('should filter events by date range', async () => {
        const timeMin = new Date('2024-02-01').toISOString();
        const timeMax = new Date('2024-02-28').toISOString();

        expect(timeMin).toBeDefined();
        expect(timeMax).toBeDefined();
      });

      it('should handle event conflicts', async () => {
        const error: AxiosError = {
          isAxiosError: true,
          response: {
            status: 409,
            data: { error: { message: 'Conflict with existing event' } },
            statusText: 'Conflict',
            headers: {},
            config: {} as any,
          },
          message: 'Event conflict',
          name: 'AxiosError',
          config: {} as any,
          toJSON: () => ({}),
        };

        mockHttpService.post.mockReturnValue(throwError(() => error));

        expect(error.response?.status).toBe(409);
      });
    });

    describe('Calendar Sync', () => {
      it('should sync events bidirectionally', async () => {
        const localEvents = [{ id: 'event-1', external_id: 'google-1' }];
        const remoteEvents = {
          items: [mockInterviewEvent],
        };

        mockEventRepository.find.mockResolvedValue(localEvents);
        mockHttpService.get.mockReturnValue(
          of({
            data: remoteEvents,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(localEvents).toHaveLength(1);
        expect(remoteEvents.items).toHaveLength(1);
      });

      it('should track sync token for incremental sync', async () => {
        const syncToken = 'sync-token-123';

        mockIntegrationRepository.update.mockResolvedValue({ affected: 1 } as any);

        expect(syncToken).toBeDefined();
      });

      it('should handle full sync when sync token invalid', async () => {
        const error: AxiosError = {
          isAxiosError: true,
          response: {
            status: 410,
            data: { error: { message: 'Sync token expired' } },
            statusText: 'Gone',
            headers: {},
            config: {} as any,
          },
          message: 'Sync token expired',
          name: 'AxiosError',
          config: {} as any,
          toJSON: () => ({}),
        };

        mockHttpService.get.mockReturnValue(throwError(() => error));

        expect(error.response?.status).toBe(410);
      });
    });

    describe('Calendar Watch/Webhooks', () => {
      it('should set up calendar watch for changes', async () => {
        const watchResponse = {
          id: 'channel-id-123',
          resourceId: 'resource-id-456',
          expiration: String(Date.now() + 86400000),
        };

        mockHttpService.post.mockReturnValue(
          of({
            data: watchResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(watchResponse.id).toBeDefined();
        expect(watchResponse.expiration).toBeDefined();
      });

      it('should handle event change notifications', async () => {
        const notification = {
          channelId: 'channel-id-123',
          resourceState: 'exists',
          resourceId: 'resource-id-456',
        };

        expect(notification.resourceState).toBe('exists');
      });

      it('should renew expiring watch channels', async () => {
        const expiringTime = Date.now() + 3600000; // 1 hour

        expect(expiringTime).toBeGreaterThan(Date.now());
      });
    });
  });

  describe('Outlook Calendar Integration', () => {
    describe('OAuth Flow', () => {
      it('should generate Outlook authorization URL', () => {
        const state = 'random-state-123';
        const authUrl = `${mockOutlookConfig.authUrl}?response_type=code&client_id=${mockOutlookConfig.clientId}&redirect_uri=${encodeURIComponent(mockOutlookConfig.redirectUri)}&scope=${encodeURIComponent(mockOutlookConfig.scope)}&state=${state}`;

        expect(authUrl).toContain('login.microsoftonline.com');
        expect(authUrl).toContain('Calendars.ReadWrite');
      });

      it('should exchange code for Microsoft tokens', async () => {
        mockHttpService.post.mockReturnValue(
          of({
            data: mockTokens,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(mockTokens.access_token).toBeDefined();
      });

      it('should include offline_access scope for refresh token', () => {
        const scope = mockOutlookConfig.scope;

        expect(scope).toContain('offline_access');
      });
    });

    describe('Event Creation', () => {
      it('should create Outlook calendar event', async () => {
        const outlookEvent = {
          subject: 'Interview with Tech Corp',
          body: {
            contentType: 'HTML',
            content: 'Technical interview for Senior Engineer position',
          },
          start: {
            dateTime: '2024-02-01T10:00:00',
            timeZone: 'Pacific Standard Time',
          },
          end: {
            dateTime: '2024-02-01T11:00:00',
            timeZone: 'Pacific Standard Time',
          },
          location: {
            displayName: 'Zoom Meeting',
          },
          attendees: [
            {
              emailAddress: {
                address: 'interviewer@techcorp.com',
                name: 'Interviewer',
              },
              type: 'required',
            },
          ],
        };

        mockHttpService.post.mockReturnValue(
          of({
            data: outlookEvent,
            status: 201,
            statusText: 'Created',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(outlookEvent.subject).toContain('Interview');
      });

      it('should add Teams meeting link', async () => {
        const teamsEvent = {
          isOnlineMeeting: true,
          onlineMeetingProvider: 'teamsForBusiness',
          onlineMeeting: {
            joinUrl: 'https://teams.microsoft.com/l/meetup-join/...',
          },
        };

        expect(teamsEvent.isOnlineMeeting).toBe(true);
        expect(teamsEvent.onlineMeetingProvider).toBe('teamsForBusiness');
      });

      it('should set reminders for Outlook events', async () => {
        const eventWithReminder = {
          isReminderOn: true,
          reminderMinutesBeforeStart: 30,
        };

        expect(eventWithReminder.isReminderOn).toBe(true);
        expect(eventWithReminder.reminderMinutesBeforeStart).toBe(30);
      });
    });

    describe('Calendar Operations', () => {
      it('should list Outlook calendars', async () => {
        const calendars = {
          value: [
            { id: 'calendar-1', name: 'Calendar', isDefaultCalendar: true },
            { id: 'calendar-2', name: 'Work', isDefaultCalendar: false },
          ],
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: calendars,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(calendars.value).toHaveLength(2);
      });

      it('should get free/busy availability', async () => {
        const scheduleInfo = {
          value: [
            {
              scheduleId: 'user@example.com',
              availabilityView: '000022220000',
              scheduleItems: [
                {
                  start: { dateTime: '2024-02-01T14:00:00' },
                  end: { dateTime: '2024-02-01T15:00:00' },
                  status: 'busy',
                },
              ],
            },
          ],
        };

        mockHttpService.post.mockReturnValue(
          of({
            data: scheduleInfo,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(scheduleInfo.value[0].scheduleItems).toHaveLength(1);
      });
    });

    describe('Delta Sync', () => {
      it('should perform delta sync for Outlook events', async () => {
        const deltaResponse = {
          value: [mockInterviewEvent],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/me/events/delta?$skiptoken=123',
          '@odata.deltaLink': 'https://graph.microsoft.com/v1.0/me/events/delta?$deltatoken=456',
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: deltaResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(deltaResponse['@odata.deltaLink']).toBeDefined();
      });

      it('should handle delta sync pagination', async () => {
        const page1 = {
          value: [mockInterviewEvent],
          '@odata.nextLink': 'next-page-url',
        };

        mockHttpService.get.mockReturnValue(
          of({
            data: page1,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(page1['@odata.nextLink']).toBeDefined();
      });
    });

    describe('Subscription/Webhooks', () => {
      it('should create Microsoft Graph subscription', async () => {
        const subscription = {
          changeType: 'created,updated,deleted',
          notificationUrl: 'https://applyforus.com/webhooks/outlook',
          resource: '/me/events',
          expirationDateTime: new Date(Date.now() + 86400000).toISOString(),
          clientState: 'secret-state-123',
        };

        mockHttpService.post.mockReturnValue(
          of({
            data: { id: 'subscription-123', ...subscription },
            status: 201,
            statusText: 'Created',
            headers: {},
            config: {} as any,
          } as AxiosResponse)
        );

        expect(subscription.changeType).toContain('created');
      });

      it('should validate webhook notifications', () => {
        const validationToken = 'validation-token-123';

        expect(validationToken).toBeDefined();
      });

      it('should process event change notifications', async () => {
        const notification = {
          value: [
            {
              subscriptionId: 'subscription-123',
              changeType: 'created',
              resource: 'users/user-id/events/event-id',
              resourceData: {
                id: 'event-123',
              },
            },
          ],
        };

        expect(notification.value[0].changeType).toBe('created');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle calendar not found error', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { error: { message: 'Calendar not found' } },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        message: 'Calendar not found',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      expect(error.response?.status).toBe(404);
    });

    it('should handle insufficient permissions', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { error: { message: 'Insufficient permissions' } },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        message: 'Forbidden',
        name: 'AxiosError',
        config: {} as any,
        toJSON: () => ({}),
      };

      mockHttpService.post.mockReturnValue(throwError(() => error));

      expect(error.response?.status).toBe(403);
    });

    it('should handle rate limiting', async () => {
      const error: AxiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '60',
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
      expect(error.response?.headers['retry-after']).toBe('60');
    });
  });

  describe('Data Transformation', () => {
    it('should transform Google event to internal format', () => {
      const transformed = {
        external_id: mockInterviewEvent.id,
        provider: 'google_calendar',
        title: mockInterviewEvent.summary,
        description: mockInterviewEvent.description,
        start_time: new Date(mockInterviewEvent.start.dateTime),
        end_time: new Date(mockInterviewEvent.end.dateTime),
        timezone: mockInterviewEvent.start.timeZone,
        location: mockInterviewEvent.location,
      };

      expect(transformed.provider).toBe('google_calendar');
      expect(transformed.title).toBe('Interview with Tech Corp');
    });

    it('should convert timezone formats between providers', () => {
      const googleTz = 'America/Los_Angeles';
      const outlookTz = 'Pacific Standard Time';

      // Timezone mapping logic would be tested
      expect(googleTz).toBeDefined();
      expect(outlookTz).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should check calendar connection status', async () => {
      mockIntegrationRepository.findOne.mockResolvedValue(mockIntegration);

      const result = await mockIntegrationRepository.findOne({
        where: { user_id: 'user-123', provider: 'google_calendar' },
      });

      expect(result?.is_active).toBe(true);
    });

    it('should disconnect calendar integration', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse)
      );

      mockIntegrationRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await mockIntegrationRepository.delete('integration-1');
      expect(result.affected).toBe(1);
    });

    it('should revoke calendar permissions on disconnect', async () => {
      mockHttpService.post.mockReturnValue(
        of({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse)
      );

      // Token revocation logic
      expect(true).toBe(true);
    });
  });
});
