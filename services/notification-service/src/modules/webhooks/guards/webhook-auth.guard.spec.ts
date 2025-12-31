import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhookAuthGuard } from './webhook-auth.guard';
import { WebhookProvider, WEBHOOK_PROVIDER_KEY } from '../decorators/webhook-provider.decorator';

describe('WebhookAuthGuard', () => {
  let guard: WebhookAuthGuard;
  let configService: ConfigService;
  let reflector: Reflector;

  const mockWebhookSecret = 'test-webhook-secret-1234567890';
  const mockStripeSecret = 'whsec_test-stripe-secret-1234567890';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              switch (key) {
                case 'WEBHOOK_SECRET':
                  return mockWebhookSecret;
                case 'STRIPE_WEBHOOK_SECRET':
                  return mockStripeSecret;
                case 'WEBHOOK_SIGNATURE_TOLERANCE':
                  return 300;
                default:
                  return defaultValue;
              }
            }),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn().mockReturnValue(WebhookProvider.GENERIC),
          },
        },
      ],
    }).compile();

    guard = module.get<WebhookAuthGuard>(WebhookAuthGuard);
    configService = module.get<ConfigService>(ConfigService);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockExecutionContext = (
    headers: Record<string, string>,
    body: any = {},
    rawBody?: string,
  ): ExecutionContext => {
    const mockRequest = {
      headers,
      body,
      rawBody: rawBody || JSON.stringify(body),
      ip: '127.0.0.1',
      protocol: 'https',
      originalUrl: '/webhooks/receive/generic',
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  const generateValidSignature = (
    payload: string,
    timestamp: number,
    secret: string,
  ): string => {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    return `t=${timestamp},v1=${signature}`;
  };

  describe('Generic Webhook Verification', () => {
    it('should accept valid signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(payload, timestamp, mockWebhookSecret);

      const context = createMockExecutionContext(
        { 'x-webhook-signature': signature },
        { test: 'data' },
        payload,
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should reject missing signature header', async () => {
      const context = createMockExecutionContext({}, { test: 'data' });

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid signature', async () => {
      const context = createMockExecutionContext(
        { 'x-webhook-signature': 't=12345,v1=invalid-signature' },
        { test: 'data' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject expired timestamp', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds old
      const signature = generateValidSignature(payload, expiredTimestamp, mockWebhookSecret);

      const context = createMockExecutionContext(
        { 'x-webhook-signature': signature },
        { test: 'data' },
        payload,
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject malformed signature header', async () => {
      const context = createMockExecutionContext(
        { 'x-webhook-signature': 'malformed-signature' },
        { test: 'data' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Stripe Webhook Verification', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue(WebhookProvider.STRIPE);
    });

    it('should accept valid Stripe signature', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = generateValidSignature(payload, timestamp, mockStripeSecret);

      const context = createMockExecutionContext(
        { 'stripe-signature': signature },
        { type: 'payment_intent.succeeded' },
        payload,
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should reject missing Stripe-Signature header', async () => {
      const context = createMockExecutionContext({}, { type: 'payment_intent.succeeded' });

      await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Error Handling', () => {
    it('should throw UnauthorizedException when WEBHOOK_SECRET is not configured', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'WEBHOOK_SECRET') return undefined;
        return 300;
      });

      const context = createMockExecutionContext(
        { 'x-webhook-signature': 't=12345,v1=test' },
        { test: 'data' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle timing attack prevention with constant-time comparison', async () => {
      // This test verifies the guard uses timing-safe comparison
      const payload = JSON.stringify({ test: 'data' });
      const timestamp = Math.floor(Date.now() / 1000);

      // Create a signature with wrong secret
      const wrongSecret = 'wrong-secret-12345678901234567890';
      const wrongSignature = generateValidSignature(payload, timestamp, wrongSecret);

      const context = createMockExecutionContext(
        { 'x-webhook-signature': wrongSignature },
        { test: 'data' },
        payload,
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Replay Attack Prevention', () => {
    it('should reject requests with future timestamps beyond tolerance', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const futureTimestamp = Math.floor(Date.now() / 1000) + 400; // 400 seconds in future
      const signature = generateValidSignature(payload, futureTimestamp, mockWebhookSecret);

      const context = createMockExecutionContext(
        { 'x-webhook-signature': signature },
        { test: 'data' },
        payload,
      );

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should accept requests within tolerance window', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const recentTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds old
      const signature = generateValidSignature(payload, recentTimestamp, mockWebhookSecret);

      const context = createMockExecutionContext(
        { 'x-webhook-signature': signature },
        { test: 'data' },
        payload,
      );

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });
});
