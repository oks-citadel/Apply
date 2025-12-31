import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for specifying webhook provider type
 */
export const WEBHOOK_PROVIDER_KEY = 'webhook_provider';

/**
 * Supported webhook providers for signature verification
 */
export enum WebhookProvider {
  /** Generic webhook with X-Webhook-Signature header */
  GENERIC = 'generic',
  /** Stripe webhooks with Stripe-Signature header */
  STRIPE = 'stripe',
  /** SendGrid event webhooks */
  SENDGRID = 'sendgrid',
  /** Twilio SMS/Voice webhooks */
  TWILIO = 'twilio',
}

/**
 * Decorator to specify which webhook provider's signature format to use
 *
 * @example
 * ```typescript
 * @Post('stripe')
 * @UseGuards(WebhookAuthGuard)
 * @WebhookProviderType(WebhookProvider.STRIPE)
 * async handleStripeWebhook(@Body() payload: any) {
 *   // Handle Stripe webhook
 * }
 * ```
 */
export const WebhookProviderType = (provider: WebhookProvider) =>
  SetMetadata(WEBHOOK_PROVIDER_KEY, provider);
