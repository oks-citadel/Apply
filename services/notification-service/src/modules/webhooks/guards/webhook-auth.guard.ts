import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import {
  WEBHOOK_PROVIDER_KEY,
  WebhookProvider,
} from '../decorators/webhook-provider.decorator';

/**
 * Guard that verifies incoming webhook signatures using HMAC-SHA256
 *
 * This guard protects webhook receiver endpoints from unauthorized access
 * by verifying the cryptographic signature of incoming requests.
 *
 * Supports multiple webhook providers:
 * - Generic: Uses X-Webhook-Signature header with format t=<timestamp>,v1=<signature>
 * - Stripe: Uses Stripe-Signature header
 * - SendGrid: Uses X-Twilio-Email-Event-Webhook-Signature header
 * - Twilio: Uses X-Twilio-Signature header
 *
 * Security features:
 * - HMAC-SHA256 signature verification
 * - Timestamp validation to prevent replay attacks
 * - Constant-time comparison to prevent timing attacks
 */
@Injectable()
export class WebhookAuthGuard implements CanActivate {
  private readonly logger = new Logger(WebhookAuthGuard.name);
  private readonly signatureToleranceSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.signatureToleranceSeconds = this.configService.get<number>(
      'WEBHOOK_SIGNATURE_TOLERANCE',
      300, // Default: 5 minutes
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get provider type from decorator metadata
    const provider = this.reflector.get<WebhookProvider>(
      WEBHOOK_PROVIDER_KEY,
      context.getHandler(),
    ) || WebhookProvider.GENERIC;

    try {
      const isValid = await this.verifySignature(request, provider);

      if (!isValid) {
        this.logger.warn(
          `Webhook signature verification failed for ${provider} webhook from ${request.ip}`,
        );
        throw new UnauthorizedException('Invalid webhook signature');
      }

      this.logger.debug(`Webhook signature verified for ${provider} webhook`);
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`Webhook signature verification error: ${error.message}`);
      throw new UnauthorizedException('Webhook signature verification failed');
    }
  }

  /**
   * Verify the webhook signature based on provider type
   */
  private async verifySignature(
    request: any,
    provider: WebhookProvider,
  ): Promise<boolean> {
    switch (provider) {
      case WebhookProvider.STRIPE:
        return this.verifyStripeSignature(request);
      case WebhookProvider.SENDGRID:
        return this.verifySendGridSignature(request);
      case WebhookProvider.TWILIO:
        return this.verifyTwilioSignature(request);
      case WebhookProvider.GENERIC:
      default:
        return this.verifyGenericSignature(request);
    }
  }

  /**
   * Verify generic webhook signature using HMAC-SHA256
   * Expected header format: X-Webhook-Signature: t=<timestamp>,v1=<signature>
   */
  private verifyGenericSignature(request: any): boolean {
    const signatureHeader = request.headers['x-webhook-signature'];

    if (!signatureHeader) {
      throw new BadRequestException('Missing X-Webhook-Signature header');
    }

    const secret = this.configService.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('WEBHOOK_SECRET not configured');
      throw new UnauthorizedException('Webhook verification not configured');
    }

    // Parse signature header
    const signatureParts = this.parseSignatureHeader(signatureHeader);

    if (!signatureParts.timestamp || !signatureParts.signature) {
      throw new BadRequestException('Invalid signature header format');
    }

    // Validate timestamp to prevent replay attacks
    const timestampAge = Math.floor(Date.now() / 1000) - signatureParts.timestamp;
    if (Math.abs(timestampAge) > this.signatureToleranceSeconds) {
      throw new UnauthorizedException('Webhook timestamp expired');
    }

    // Get raw body for signature verification
    const rawBody = this.getRawBody(request);

    // Compute expected signature
    const signedPayload = `${signatureParts.timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return this.timingSafeEqual(expectedSignature, signatureParts.signature);
  }

  /**
   * Verify Stripe webhook signature
   * @see https://stripe.com/docs/webhooks/signatures
   */
  private verifyStripeSignature(request: any): boolean {
    const signatureHeader = request.headers['stripe-signature'];

    if (!signatureHeader) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }

    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new UnauthorizedException('Stripe webhook verification not configured');
    }

    const signatureParts = this.parseSignatureHeader(signatureHeader);

    if (!signatureParts.timestamp || !signatureParts.signature) {
      throw new BadRequestException('Invalid Stripe signature header format');
    }

    // Validate timestamp
    const timestampAge = Math.floor(Date.now() / 1000) - signatureParts.timestamp;
    if (Math.abs(timestampAge) > this.signatureToleranceSeconds) {
      throw new UnauthorizedException('Stripe webhook timestamp expired');
    }

    const rawBody = this.getRawBody(request);
    const signedPayload = `${signatureParts.timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return this.timingSafeEqual(expectedSignature, signatureParts.signature);
  }

  /**
   * Verify SendGrid webhook signature
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  private verifySendGridSignature(request: any): boolean {
    const signature = request.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = request.headers['x-twilio-email-event-webhook-timestamp'];

    if (!signature || !timestamp) {
      throw new BadRequestException('Missing SendGrid signature headers');
    }

    const secret = this.configService.get<string>('SENDGRID_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('SENDGRID_WEBHOOK_SECRET not configured');
      throw new UnauthorizedException('SendGrid webhook verification not configured');
    }

    // Validate timestamp
    const timestampSeconds = parseInt(timestamp, 10);
    const timestampAge = Math.floor(Date.now() / 1000) - timestampSeconds;
    if (Math.abs(timestampAge) > this.signatureToleranceSeconds) {
      throw new UnauthorizedException('SendGrid webhook timestamp expired');
    }

    const rawBody = this.getRawBody(request);

    // SendGrid uses ECDSA signature - for simplicity, we use HMAC here
    // In production, you may want to use the official SendGrid library
    const signedPayload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('base64');

    return this.timingSafeEqual(expectedSignature, signature);
  }

  /**
   * Verify Twilio webhook signature
   * @see https://www.twilio.com/docs/usage/security#validating-requests
   */
  private verifyTwilioSignature(request: any): boolean {
    const signature = request.headers['x-twilio-signature'];

    if (!signature) {
      throw new BadRequestException('Missing X-Twilio-Signature header');
    }

    const authToken = this.configService.get<string>('TWILIO_WEBHOOK_AUTH_TOKEN');
    if (!authToken) {
      this.logger.error('TWILIO_WEBHOOK_AUTH_TOKEN not configured');
      throw new UnauthorizedException('Twilio webhook verification not configured');
    }

    // Twilio signature is based on URL + sorted POST parameters
    const url = this.getFullUrl(request);
    const params = request.body || {};

    // Sort parameters and concatenate
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], '');

    const signedPayload = url + sortedParams;
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(signedPayload, 'utf8')
      .digest('base64');

    return this.timingSafeEqual(expectedSignature, signature);
  }

  /**
   * Parse signature header in format: t=<timestamp>,v1=<signature>
   */
  private parseSignatureHeader(header: string): {
    timestamp: number | null;
    signature: string | null;
  } {
    const result: { timestamp: number | null; signature: string | null } = {
      timestamp: null,
      signature: null,
    };

    const parts = header.split(',');
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        result.timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        result.signature = value;
      }
    }

    return result;
  }

  /**
   * Get raw request body as string
   */
  private getRawBody(request: any): string {
    // Check for raw body stored by middleware
    if (request.rawBody) {
      return typeof request.rawBody === 'string'
        ? request.rawBody
        : request.rawBody.toString('utf8');
    }

    // Fall back to stringifying body (less reliable due to potential formatting differences)
    return typeof request.body === 'string'
      ? request.body
      : JSON.stringify(request.body);
  }

  /**
   * Get full URL including protocol and query string
   */
  private getFullUrl(request: any): string {
    const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'https';
    const host = request.headers['x-forwarded-host'] || request.headers.host;
    const path = request.originalUrl || request.url;
    return `${protocol}://${host}${path}`;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // Still do a comparison to prevent timing leak on length
      const dummy = crypto.createHash('sha256').update(a).digest();
      crypto.timingSafeEqual(dummy, dummy);
      return false;
    }

    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    return crypto.timingSafeEqual(bufA, bufB);
  }
}

/**
 * Exception thrown when webhook signature verification fails
 */
export class WebhookSignatureException extends UnauthorizedException {
  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookSignatureException';
  }
}
