# Payment Service - API Examples

Complete API request examples for the Payment Service.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All requests require an API key header:
```
X-API-Key: your-secret-api-key-here
```

---

## Subscriptions API

### 1. Create Checkout Session

Create a Stripe checkout session for a new subscription.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/checkout-session \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "userId": "user-123",
    "userEmail": "user@example.com",
    "tier": "BASIC",
    "billingPeriod": "monthly",
    "successUrl": "http://localhost:3001/success",
    "cancelUrl": "http://localhost:3001/cancel"
  }'
```

Response:
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6",
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6"
}
```

### 2. Get User Subscription

Retrieve the current subscription for a user.

```bash
curl -X GET http://localhost:3000/api/v1/subscriptions/user/user-123 \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "id": "sub-uuid-123",
  "userId": "user-123",
  "tier": "BASIC",
  "status": "active",
  "stripeCustomerId": "cus_123",
  "stripeSubscriptionId": "sub_123",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. Get Subscription Limits

Get the usage limits for a user's subscription tier.

```bash
curl -X GET http://localhost:3000/api/v1/subscriptions/user/user-123/limits \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "jobApplicationsPerMonth": 50,
  "aiGeneratedCoverLetters": 20,
  "resumeTemplates": 10,
  "savedJobs": 100,
  "emailAlerts": true,
  "prioritySupport": false,
  "advancedAnalytics": false,
  "customBranding": false
}
```

### 4. Check Feature Access

Check if a user has access to a specific feature.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/user/user-123/check-feature \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "feature": "prioritySupport"
  }'
```

Response:
```json
{
  "hasAccess": false
}
```

### 5. Check Usage Limits

Check if a user can perform an action based on their current usage.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/user/user-123/check-usage \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "usageType": "jobApplications",
    "currentUsage": 45
  }'
```

Response:
```json
{
  "allowed": true,
  "limit": 50,
  "remaining": 5
}
```

### 6. Upgrade Subscription

Upgrade a subscription to a higher tier.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/sub-uuid-123/upgrade \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "tier": "PRO",
    "billingPeriod": "monthly"
  }'
```

Response:
```json
{
  "id": "sub-uuid-123",
  "userId": "user-123",
  "tier": "PRO",
  "status": "active",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### 7. Cancel Subscription

Cancel a subscription (at period end or immediately).

```bash
# Cancel at period end
curl -X POST http://localhost:3000/api/v1/subscriptions/sub-uuid-123/cancel \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "immediately": false
  }'
```

Response:
```json
{
  "id": "sub-uuid-123",
  "userId": "user-123",
  "tier": "BASIC",
  "status": "active",
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2024-02-01T00:00:00Z"
}
```

### 8. Reactivate Subscription

Reactivate a canceled subscription.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/sub-uuid-123/reactivate \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "id": "sub-uuid-123",
  "userId": "user-123",
  "tier": "BASIC",
  "status": "active",
  "cancelAtPeriodEnd": false,
  "canceledAt": null
}
```

### 9. Create Billing Portal Session

Create a Stripe billing portal session for subscription management.

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/sub-uuid-123/billing-portal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "returnUrl": "http://localhost:3001/account"
  }'
```

Response:
```json
{
  "sessionUrl": "https://billing.stripe.com/session/abc123"
}
```

### 10. List All Subscriptions

Get a paginated list of all subscriptions.

```bash
curl -X GET "http://localhost:3000/api/v1/subscriptions?page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "data": [
    {
      "id": "sub-uuid-123",
      "userId": "user-123",
      "tier": "BASIC",
      "status": "active"
    }
  ],
  "total": 100,
  "page": 1,
  "lastPage": 10
}
```

---

## Invoices API

### 1. Get Subscription Invoices

Get all invoices for a subscription.

```bash
curl -X GET "http://localhost:3000/api/v1/invoices/subscription/sub-uuid-123?page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "data": [
    {
      "id": "inv-uuid-123",
      "subscriptionId": "sub-uuid-123",
      "stripeInvoiceId": "in_123",
      "amount": 9.99,
      "currency": "usd",
      "status": "paid",
      "paidAt": "2024-01-01T00:00:00Z",
      "invoiceUrl": "https://invoice.stripe.com/i/acct_xxx/invst_xxx",
      "invoicePdfUrl": "https://pay.stripe.com/invoice/acct_xxx/invst_xxx/pdf"
    }
  ],
  "total": 5,
  "page": 1,
  "lastPage": 1
}
```

### 2. Get Customer Invoices

Get all invoices for a Stripe customer.

```bash
curl -X GET "http://localhost:3000/api/v1/invoices/customer/cus_123?page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

### 3. Get Invoice Statistics

Get overall invoice statistics.

```bash
curl -X GET http://localhost:3000/api/v1/invoices/statistics \
  -H "X-API-Key: your-api-key"
```

Response:
```json
{
  "totalInvoices": 150,
  "paidInvoices": 140,
  "openInvoices": 10,
  "totalRevenue": 1499.00
}
```

### 4. Mark Invoice as Paid

Manually mark an invoice as paid.

```bash
curl -X POST http://localhost:3000/api/v1/invoices/inv-uuid-123/mark-paid \
  -H "X-API-Key: your-api-key"
```

### 5. Mark Invoice as Void

Mark an invoice as void.

```bash
curl -X POST http://localhost:3000/api/v1/invoices/inv-uuid-123/mark-void \
  -H "X-API-Key: your-api-key"
```

---

## Stripe Webhooks

### Webhook Endpoint

```
POST http://localhost:3000/api/v1/stripe/webhook
```

The webhook endpoint automatically handles the following Stripe events:

1. **checkout.session.completed** - Creates subscription after successful checkout
2. **customer.subscription.created** - Creates/updates subscription record
3. **customer.subscription.updated** - Updates subscription status/tier
4. **customer.subscription.deleted** - Marks subscription as canceled
5. **invoice.paid** - Records successful payment
6. **invoice.payment_failed** - Updates subscription to past_due
7. **invoice.created** - Creates invoice record

Example webhook payload (checkout.session.completed):
```json
{
  "id": "evt_123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "customer": "cus_123",
      "subscription": "sub_123",
      "metadata": {
        "userId": "user-123",
        "tier": "BASIC"
      }
    }
  }
}
```

---

## Health Check API

### 1. Comprehensive Health Check

```bash
curl -X GET http://localhost:3000/api/v1/health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "disk": {
      "status": "up"
    }
  }
}
```

### 2. Readiness Check

```bash
curl -X GET http://localhost:3000/api/v1/health/ready
```

### 3. Liveness Check

```bash
curl -X GET http://localhost:3000/api/v1/health/live
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.678,
  "service": "payment-service"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/subscriptions/checkout-session",
  "method": "POST",
  "message": "User already has an active subscription"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/subscriptions",
  "method": "GET",
  "message": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/subscriptions/invalid-id",
  "method": "GET",
  "message": "Subscription with ID invalid-id not found"
}
```

---

## Testing with Postman

Import this collection into Postman:

1. Create a new environment with:
   - `baseUrl`: `http://localhost:3000/api/v1`
   - `apiKey`: `your-secret-api-key-here`

2. Set headers for all requests:
   - `X-API-Key`: `{{apiKey}}`
   - `Content-Type`: `application/json`

---

## Testing with Stripe CLI

### 1. Forward Webhooks
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
```

### 2. Trigger Test Events
```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test subscription updated
stripe trigger customer.subscription.updated

# Test invoice paid
stripe trigger invoice.paid
```

---

## Rate Limiting Recommendations

Consider implementing rate limiting for production:

- Subscription endpoints: 100 requests per minute per user
- Webhook endpoint: 1000 requests per minute
- Health check endpoints: Unlimited

---

## Additional Resources

- **Swagger UI**: http://localhost:3000/api/docs
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Stripe API Docs**: https://stripe.com/docs/api
