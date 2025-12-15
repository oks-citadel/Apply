# Webhook Security Implementation

This document describes the webhook signature validation implementation for all payment providers in the payment service.

## Overview

All payment webhook endpoints now validate signatures to prevent unauthorized webhook events. This prevents attackers from sending fake payment confirmations or subscription updates.

## Security Implementation by Provider

### 1. Stripe

**Endpoint**: `POST /stripe/webhook`

**Validation Method**: HMAC SHA256 using Stripe's official SDK

**Implementation**:
- Uses `stripe.webhooks.constructEvent()` from the official Stripe SDK
- Validates the `stripe-signature` header against the raw request body
- Requires `STRIPE_WEBHOOK_SECRET` environment variable (starts with `whsec_`)

**Configuration**:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**How to get the secret**:
1. Log in to Stripe Dashboard
2. Go to Developers → Webhooks
3. Create or select a webhook endpoint
4. Copy the "Signing secret"

**Code Location**:
- Controller: `src/modules/stripe/stripe.controller.ts`
- Service: `src/modules/stripe/stripe.service.ts` (method: `constructWebhookEvent`)

---

### 2. Paystack

**Endpoint**: `POST /paystack/webhook`

**Validation Method**: HMAC SHA512

**Implementation**:
- Validates the `x-paystack-signature` header
- Uses raw request body (Buffer) for HMAC computation
- Computes HMAC-SHA512 of the raw body using the secret key
- Compares computed hash with the signature header

**Configuration**:
```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
```

**How it works**:
```javascript
// Paystack sends HMAC-SHA512 hash in x-paystack-signature header
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(rawBody)
  .digest('hex');

// Compare computed hash with signature
return hash === signature;
```

**Code Location**:
- Controller: `src/modules/paystack/paystack.controller.ts`
- Service: `src/modules/paystack/paystack.service.ts` (method: `verifyWebhookSignature`)

---

### 3. Flutterwave

**Endpoint**: `POST /flutterwave/webhook`

**Validation Method**: Secret Hash Comparison

**Implementation**:
- Validates the `verif-hash` header
- Flutterwave sends a secret hash value that should match your webhook secret
- Simple string comparison (no HMAC computation needed)

**Configuration**:
```env
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_hash
```

**How to get the secret**:
1. Log in to Flutterwave Dashboard
2. Go to Settings → Webhooks
3. Copy the "Secret Hash" value
4. Add it to your environment variables

**How it works**:
```javascript
// Flutterwave sends the webhook secret in verif-hash header
// Simply compare it with our configured secret
return verifHash === FLUTTERWAVE_WEBHOOK_SECRET;
```

**Code Location**:
- Controller: `src/modules/flutterwave/flutterwave.controller.ts`
- Service: `src/modules/flutterwave/flutterwave.service.ts` (method: `verifyWebhookSignature`)

---

## Security Best Practices

### 1. Raw Body Requirement

All webhook endpoints require access to the raw request body (Buffer) for signature validation:

```typescript
async handleWebhook(
  @Req() request: RawBodyRequest<Request>,
  @Headers('signature-header') signature: string,
  @Body() payload: WebhookPayload,
)
```

**Important**: The raw body must be preserved before JSON parsing. This is typically configured in NestJS:

```typescript
// main.ts
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
```

### 2. Signature Header Validation

Each provider uses different header names:
- **Stripe**: `stripe-signature`
- **Paystack**: `x-paystack-signature`
- **Flutterwave**: `verif-hash`

All endpoints validate that the signature header is present before processing.

### 3. Error Handling

Invalid signatures result in:
- HTTP 400 Bad Request response
- Detailed error logging
- No webhook event processing

### 4. Environment Variables

All webhook secrets must be configured as environment variables. The services check for missing configuration and log warnings during initialization.

### 5. Constant-Time Comparison

For HMAC-based validation (Stripe, Paystack), the comparison should be constant-time to prevent timing attacks. The Stripe SDK handles this automatically. For custom implementations, consider using `crypto.timingSafeEqual()`.

---

## Testing Webhook Security

### Testing with Provider CLIs

**Stripe**:
```bash
# Install Stripe CLI
stripe listen --forward-to http://localhost:3000/stripe/webhook
stripe trigger payment_intent.succeeded
```

**Paystack**:
Use the Paystack Dashboard to send test webhooks to your endpoint.

**Flutterwave**:
Use the Flutterwave Dashboard to configure and test webhooks.

### Manual Testing

For security testing, you can try sending webhooks without proper signatures:

```bash
# This should fail with 400 Bad Request
curl -X POST http://localhost:3000/paystack/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{}}'

# This should also fail (invalid signature)
curl -X POST http://localhost:3000/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: invalid-signature" \
  -d '{"event":"charge.success","data":{}}'
```

---

## Configuration Checklist

Before deploying to production:

- [ ] Set `STRIPE_WEBHOOK_SECRET` for Stripe integration
- [ ] Set `PAYSTACK_SECRET_KEY` for Paystack integration
- [ ] Set `FLUTTERWAVE_WEBHOOK_SECRET` for Flutterwave integration
- [ ] Configure webhook URLs in each provider's dashboard
- [ ] Test webhook signature validation for each provider
- [ ] Enable HTTPS for webhook endpoints (required by all providers)
- [ ] Monitor webhook logs for signature validation failures
- [ ] Set up alerts for repeated signature validation failures (potential attack)

---

## Security Incident Response

If you suspect webhook security has been compromised:

1. **Immediately rotate webhook secrets** in all provider dashboards
2. **Update environment variables** with new secrets
3. **Restart the payment service** to load new secrets
4. **Review webhook logs** for suspicious activity
5. **Check database** for any fraudulent transactions or subscriptions
6. **Notify affected users** if any unauthorized changes were made

---

## Common Issues

### Issue: "Webhook secret not configured"

**Solution**: Ensure the environment variable is set:
- Stripe: `STRIPE_WEBHOOK_SECRET`
- Flutterwave: `FLUTTERWAVE_WEBHOOK_SECRET`
- Paystack: Uses `PAYSTACK_SECRET_KEY`

### Issue: "Invalid webhook signature" on legitimate webhooks

**Possible causes**:
1. Wrong secret configured (check provider dashboard)
2. Raw body not preserved (check NestJS configuration)
3. Body parser modifying the request before validation
4. Encoding issues (ensure UTF-8)

### Issue: "No raw body found in request"

**Solution**: Configure body parser to preserve raw body:
```typescript
app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
```

---

## Additional Resources

- [Stripe Webhook Signature Verification](https://stripe.com/docs/webhooks/signatures)
- [Paystack Webhook Security](https://paystack.com/docs/payments/webhooks/#verify-webhook-signature)
- [Flutterwave Webhooks](https://developer.flutterwave.com/docs/integration-guides/webhooks/)

---

## Changelog

### 2025-12-15
- ✅ Implemented webhook signature validation for all three payment providers
- ✅ Fixed Paystack to use raw body instead of JSON.stringify
- ✅ Fixed Flutterwave to use correct verification method (hash comparison)
- ✅ Added comprehensive error handling and logging
- ✅ Updated environment variable configuration
- ✅ Created security documentation
