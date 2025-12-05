# Error Codes and Handling

Comprehensive guide to error codes, responses, and handling in the JobPilot API.

## Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context",
      "reason": "Specific reason for error"
    },
    "timestamp": "2025-12-04T10:30:00Z",
    "path": "/api/v1/jobs/search",
    "request_id": "req_abc123xyz"
  },
  "statusCode": 400
}
```

### Response Fields

| Field | Description |
|-------|-------------|
| success | Always `false` for errors |
| error.code | Unique error code for programmatic handling |
| error.message | Human-readable error description |
| error.details | Additional context about the error |
| error.timestamp | When the error occurred (ISO 8601) |
| error.path | API endpoint that generated the error |
| error.request_id | Unique request identifier for debugging |
| statusCode | HTTP status code |

---

## HTTP Status Codes

### 2xx Success

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |

### 4xx Client Errors

| Code | Name | Description |
|------|------|-------------|
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Valid format but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx Server Errors

| Code | Name | Description |
|------|------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Invalid response from upstream service |
| 503 | Service Unavailable | Service temporarily unavailable |
| 504 | Gateway Timeout | Upstream service timeout |

---

## Authentication Errors (AUTH)

### AUTH001 - Invalid Credentials

**HTTP Status:** 401 Unauthorized

**Description:** Email or password is incorrect.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH001",
    "message": "Invalid email or password",
    "details": {
      "attempts_remaining": 3
    }
  },
  "statusCode": 401
}
```

**Resolution:**
- Verify email and password are correct
- Check if caps lock is enabled
- Reset password if forgotten

---

### AUTH002 - Account Locked

**HTTP Status:** 401 Unauthorized

**Description:** Account temporarily locked due to multiple failed login attempts.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH002",
    "message": "Account temporarily locked due to multiple failed login attempts",
    "details": {
      "locked_until": "2025-12-04T11:00:00Z",
      "reason": "security"
    }
  },
  "statusCode": 401
}
```

**Resolution:**
- Wait until the lockout period expires
- Use "Forgot Password" to reset
- Contact support if urgent

---

### AUTH003 - Email Not Verified

**HTTP Status:** 401 Unauthorized

**Description:** Email address has not been verified.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH003",
    "message": "Please verify your email address before logging in",
    "details": {
      "email": "user@example.com",
      "verification_sent": true
    }
  },
  "statusCode": 401
}
```

**Resolution:**
- Check email for verification link
- Request new verification email
- Check spam folder

---

### AUTH004 - MFA Token Required

**HTTP Status:** 401 Unauthorized

**Description:** Multi-factor authentication token is required.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH004",
    "message": "MFA token required",
    "details": {
      "mfa_enabled": true
    }
  },
  "statusCode": 401
}
```

**Resolution:**
- Provide MFA token in login request
- Check authenticator app for current code

---

### AUTH005 - Invalid MFA Token

**HTTP Status:** 401 Unauthorized

**Description:** Provided MFA token is invalid or expired.

**Resolution:**
- Verify token is current (tokens expire every 30 seconds)
- Ensure authenticator app time is synchronized

---

### AUTH006 - Token Expired

**HTTP Status:** 401 Unauthorized

**Description:** JWT access token has expired.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH006",
    "message": "Access token has expired",
    "details": {
      "expired_at": "2025-12-04T10:15:00Z",
      "type": "access_token"
    }
  },
  "statusCode": 401
}
```

**Resolution:**
- Use refresh token to obtain new access token
- Re-authenticate if refresh token also expired

---

### AUTH007 - Invalid Refresh Token

**HTTP Status:** 401 Unauthorized

**Description:** Refresh token is invalid, expired, or has been revoked.

**Resolution:**
- Re-authenticate to obtain new tokens
- Check if user logged out

---

### AUTH008 - User Already Exists

**HTTP Status:** 409 Conflict

**Description:** Email already registered.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH008",
    "message": "An account with this email already exists",
    "details": {
      "email": "user@example.com",
      "auth_provider": "local"
    }
  },
  "statusCode": 409
}
```

**Resolution:**
- Use different email address
- Login instead of registering
- Use "Forgot Password" if you forgot credentials

---

### AUTH009 - Invalid Password Reset Token

**HTTP Status:** 400 Bad Request

**Description:** Password reset token is invalid or expired.

**Resolution:**
- Request new password reset email
- Tokens expire after 1 hour

---

### AUTH010 - Invalid Email Verification Token

**HTTP Status:** 400 Bad Request

**Description:** Email verification token is invalid or expired.

**Resolution:**
- Request new verification email
- Tokens expire after 24 hours

---

## User Errors (USER)

### USER001 - User Not Found

**HTTP Status:** 404 Not Found

**Description:** Requested user does not exist.

---

### USER002 - Unauthorized Access

**HTTP Status:** 403 Forbidden

**Description:** Not authorized to access this user's data.

---

### USER003 - Invalid Profile Data

**HTTP Status:** 400 Bad Request

**Description:** Profile data validation failed.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "USER003",
    "message": "Invalid profile data",
    "details": {
      "validation_errors": [
        {
          "field": "phoneNumber",
          "message": "Invalid phone number format"
        }
      ]
    }
  },
  "statusCode": 400
}
```

---

### USER004 - Profile Photo Upload Failed

**HTTP Status:** 400 Bad Request

**Description:** Failed to upload profile photo.

**Possible reasons:**
- File too large (max 5MB)
- Invalid file format (only JPEG, PNG, WebP)
- File corrupted

---

### USER005 - Skill Already Exists

**HTTP Status:** 409 Conflict

**Description:** User already has this skill in their profile.

---

### USER006 - Work Experience Not Found

**HTTP Status:** 404 Not Found

---

### USER007 - Education Entry Not Found

**HTTP Status:** 404 Not Found

---

### USER008 - Subscription Not Found

**HTTP Status:** 404 Not Found

---

### USER009 - Usage Limit Exceeded

**HTTP Status:** 429 Too Many Requests

**Description:** Feature usage limit exceeded for current subscription tier.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "USER009",
    "message": "Monthly resume creation limit exceeded",
    "details": {
      "limit": 10,
      "used": 10,
      "reset_date": "2025-12-01T00:00:00Z",
      "upgrade_url": "/subscription/upgrade"
    }
  },
  "statusCode": 429
}
```

**Resolution:**
- Wait until usage limit resets
- Upgrade subscription tier
- Delete unused resources

---

### USER010 - Invalid Subscription Plan

**HTTP Status:** 400 Bad Request

**Description:** Invalid or unavailable subscription plan.

---

## Job Errors (JOB)

### JOB001 - Job Not Found

**HTTP Status:** 404 Not Found

**Description:** Requested job does not exist or has been removed.

---

### JOB002 - Invalid Search Parameters

**HTTP Status:** 400 Bad Request

**Description:** Job search parameters are invalid.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "JOB002",
    "message": "Invalid search parameters",
    "details": {
      "validation_errors": [
        {
          "field": "salary_min",
          "message": "Must be a positive number"
        },
        {
          "field": "experience_level",
          "message": "Invalid value. Must be one of: entry, junior, mid, senior, lead, executive"
        }
      ]
    }
  },
  "statusCode": 400
}
```

---

### JOB003 - Job Already Saved

**HTTP Status:** 409 Conflict

**Description:** Job is already in saved jobs list.

---

### JOB004 - Saved Job Not Found

**HTTP Status:** 404 Not Found

**Description:** Job is not in saved jobs list.

---

### JOB005 - Alert Not Found

**HTTP Status:** 404 Not Found

**Description:** Job alert does not exist or doesn't belong to user.

---

### JOB006 - Maximum Alerts Limit Reached

**HTTP Status:** 429 Too Many Requests

**Description:** User has reached maximum number of job alerts for their subscription tier.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "JOB006",
    "message": "Maximum job alerts limit reached",
    "details": {
      "current_count": 10,
      "limit": 10,
      "tier": "free"
    }
  },
  "statusCode": 429
}
```

---

### JOB007 - Company Not Found

**HTTP Status:** 404 Not Found

---

### JOB008 - Invalid Job ID Format

**HTTP Status:** 400 Bad Request

**Description:** Job ID format is invalid (should be UUID).

---

### JOB009 - Job Expired or Inactive

**HTTP Status:** 410 Gone

**Description:** Job posting has expired or is no longer active.

---

### JOB010 - Search Query Too Complex

**HTTP Status:** 400 Bad Request

**Description:** Search query is too complex or has too many parameters.

---

## Resume Errors (RES)

### RES001 - Resume Not Found

**HTTP Status:** 404 Not Found

**Description:** Resume does not exist or doesn't belong to user.

---

### RES002 - Invalid Resume Format

**HTTP Status:** 400 Bad Request

**Description:** Resume data format is invalid.

---

### RES003 - Resume Limit Reached

**HTTP Status:** 429 Too Many Requests

**Description:** Maximum number of resumes reached for subscription tier.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RES003",
    "message": "Resume creation limit reached",
    "details": {
      "current_count": 10,
      "limit": 10,
      "tier": "pro",
      "suggestion": "Delete unused resumes or upgrade plan"
    }
  },
  "statusCode": 429
}
```

---

### RES004 - Cannot Delete Primary Resume

**HTTP Status:** 400 Bad Request

**Description:** Cannot delete the primary resume. Set another resume as primary first.

---

### RES005 - Import Failed - Unsupported Format

**HTTP Status:** 400 Bad Request

**Description:** File format not supported for import.

**Supported formats:** PDF, DOCX, DOC

---

### RES006 - Import Failed - File Too Large

**HTTP Status:** 400 Bad Request

**Description:** Uploaded file exceeds maximum size limit.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RES006",
    "message": "File size exceeds maximum limit",
    "details": {
      "file_size": 12582912,
      "max_size": 10485760,
      "max_size_readable": "10MB"
    }
  },
  "statusCode": 400
}
```

---

### RES007 - Import Failed - Parsing Error

**HTTP Status:** 422 Unprocessable Entity

**Description:** Failed to parse resume content from file.

**Possible reasons:**
- File is corrupted
- File is password-protected
- File contains only images (not searchable text)
- File format is not truly PDF/DOCX

---

### RES008 - Export Failed

**HTTP Status:** 500 Internal Server Error

**Description:** Failed to export resume in requested format.

---

### RES009 - Invalid Template ID

**HTTP Status:** 404 Not Found

**Description:** Resume template does not exist.

---

### RES010 - Section Not Found

**HTTP Status:** 404 Not Found

**Description:** Resume section does not exist.

---

### RES011 - Invalid Section Type

**HTTP Status:** 400 Bad Request

**Description:** Section type is not valid.

**Valid types:** experience, education, skills, certifications, projects, custom

---

### RES012 - Version Not Found

**HTTP Status:** 404 Not Found

**Description:** Requested resume version does not exist.

---

## Application Errors (APP)

### APP001 - Application Not Found

**HTTP Status:** 404 Not Found

---

### APP002 - Invalid Application Status

**HTTP Status:** 400 Bad Request

**Description:** Provided application status is not valid.

**Valid statuses:** pending, submitted, reviewing, interviewing, offered, rejected, withdrawn, accepted, declined

---

### APP003 - Application Already Exists

**HTTP Status:** 409 Conflict

**Description:** Application for this job already exists.

---

### APP004 - Auto-Apply Limit Reached

**HTTP Status:** 429 Too Many Requests

**Description:** Daily auto-apply limit reached.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "APP004",
    "message": "Daily auto-apply limit reached",
    "details": {
      "applications_today": 100,
      "daily_limit": 100,
      "resets_at": "2025-12-05T00:00:00Z"
    }
  },
  "statusCode": 429
}
```

---

### APP005 - Invalid Campaign Configuration

**HTTP Status:** 400 Bad Request

**Description:** Auto-apply campaign configuration is invalid.

---

### APP006 - Campaign Not Found

**HTTP Status:** 404 Not Found

---

### APP007 - Resume Not Found for Application

**HTTP Status:** 404 Not Found

**Description:** Specified resume does not exist or doesn't belong to user.

---

### APP008 - Cannot Update Completed Application

**HTTP Status:** 400 Bad Request

**Description:** Cannot modify application in completed state (accepted/declined).

---

### APP009 - Invalid Date Format

**HTTP Status:** 400 Bad Request

**Description:** Date format is invalid. Use ISO 8601 format.

---

### APP010 - Missing Required Fields

**HTTP Status:** 400 Bad Request

**Description:** Required fields are missing from request.

---

## AI Service Errors (AI)

### AI001 - AI Service Temporarily Unavailable

**HTTP Status:** 503 Service Unavailable

**Description:** AI processing service is temporarily unavailable.

**Resolution:**
- Retry request after a few moments
- Check API status page
- Use basic features as fallback

---

### AI002 - Rate Limit Exceeded for AI Features

**HTTP Status:** 429 Too Many Requests

**Description:** AI feature usage limit exceeded.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AI002",
    "message": "AI feature rate limit exceeded",
    "details": {
      "feature": "job_matching",
      "limit": 10,
      "used": 10,
      "reset_date": "2025-12-05T00:00:00Z",
      "tier": "free"
    }
  },
  "statusCode": 429
}
```

---

### AI003 - Invalid Input for AI Processing

**HTTP Status:** 400 Bad Request

**Description:** Input data is invalid or insufficient for AI processing.

---

### AI004 - Resume Not Found for Analysis

**HTTP Status:** 404 Not Found

---

### AI005 - Job Not Found for Matching

**HTTP Status:** 404 Not Found

---

### AI006 - Insufficient Data for Analysis

**HTTP Status:** 422 Unprocessable Entity

**Description:** Not enough data to perform AI analysis.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AI006",
    "message": "Insufficient data for AI analysis",
    "details": {
      "missing_sections": ["experience", "skills"],
      "suggestion": "Complete your profile for better analysis"
    }
  },
  "statusCode": 422
}
```

---

### AI007 - AI Processing Timeout

**HTTP Status:** 504 Gateway Timeout

**Description:** AI processing took too long and timed out.

**Resolution:**
- Retry with simpler input
- Contact support if persists

---

### AI008 - Model Inference Error

**HTTP Status:** 500 Internal Server Error

**Description:** Error during AI model inference.

---

### AI009 - Invalid Parameters for AI Request

**HTTP Status:** 400 Bad Request

---

### AI010 - Subscription Tier Insufficient for Feature

**HTTP Status:** 403 Forbidden

**Description:** Feature not available in current subscription tier.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "AI010",
    "message": "This AI feature requires Pro subscription",
    "details": {
      "feature": "advanced_resume_analysis",
      "required_tier": "pro",
      "current_tier": "free",
      "upgrade_url": "/subscription/upgrade"
    }
  },
  "statusCode": 403
}
```

---

## Rate Limiting Errors

### RATE001 - Rate Limit Exceeded

**HTTP Status:** 429 Too Many Requests

**Description:** API rate limit exceeded.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE001",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 60,
      "window": "1 minute",
      "retry_after": 45
    }
  },
  "statusCode": 429
}
```

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1701784890
Retry-After: 45
```

**Resolution:**
- Wait before retrying (check `Retry-After` header)
- Implement exponential backoff
- Upgrade subscription for higher limits

---

## Validation Errors

### VAL001 - Validation Error

**HTTP Status:** 400 Bad Request

**Description:** Request validation failed.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "VAL001",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "value": "invalid-email"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters",
          "value": "[REDACTED]"
        }
      ]
    }
  },
  "statusCode": 400
}
```

---

## Server Errors

### SRV001 - Internal Server Error

**HTTP Status:** 500 Internal Server Error

**Description:** Unexpected error occurred on server.

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "SRV001",
    "message": "An unexpected error occurred",
    "details": {
      "request_id": "req_abc123xyz",
      "support_message": "Please contact support with this request ID"
    }
  },
  "statusCode": 500
}
```

---

### SRV002 - Service Unavailable

**HTTP Status:** 503 Service Unavailable

**Description:** Service temporarily unavailable (maintenance, high load, etc.).

---

### SRV003 - Database Error

**HTTP Status:** 500 Internal Server Error

**Description:** Database operation failed.

---

## Error Handling Best Practices

### 1. Check HTTP Status Code First

```javascript
if (response.status >= 400) {
  // Handle error
  const error = await response.json();
  console.error(`Error ${error.code}: ${error.message}`);
}
```

### 2. Use Error Codes for Programmatic Handling

```javascript
switch (error.code) {
  case 'AUTH006':
    // Token expired - refresh token
    await refreshAccessToken();
    break;
  case 'RATE001':
    // Rate limited - wait and retry
    const retryAfter = error.details.retry_after;
    await sleep(retryAfter * 1000);
    break;
  default:
    // Generic error handling
    showErrorToUser(error.message);
}
```

### 3. Implement Retry Logic

```javascript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RATE001' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}
```

### 4. Log Request IDs for Support

Always include the `request_id` when contacting support:

```javascript
console.error(`Error occurred. Request ID: ${error.request_id}`);
```

### 5. Handle Validation Errors

```javascript
if (error.code === 'VAL001') {
  error.details.errors.forEach(validationError => {
    showFieldError(validationError.field, validationError.message);
  });
}
```

---

## Common Error Scenarios

### Scenario 1: Token Expired During Request

1. Request fails with `AUTH006`
2. Use refresh token to get new access token
3. Retry original request with new token

### Scenario 2: Rate Limit Hit

1. Request fails with `RATE001`
2. Check `retry_after` in error details
3. Wait specified time
4. Retry request

### Scenario 3: Validation Errors on Form Submission

1. Request fails with `VAL001`
2. Parse validation errors from `details.errors`
3. Display errors next to respective form fields
4. User corrects and resubmits

### Scenario 4: Resource Not Found

1. Request fails with 404 status
2. Check if resource ID is correct
3. Refresh resource list
4. Show appropriate message to user

---

## Getting Help

If you encounter persistent errors:

1. Check the [API Status Page](https://status.jobpilot.com)
2. Review this error documentation
3. Search [Developer Forum](https://community.jobpilot.com)
4. Contact support with:
   - Error code
   - Request ID
   - Timestamp
   - Steps to reproduce

**Support Channels:**
- Email: api-support@jobpilot.com
- Developer Forum: https://community.jobpilot.com
- Emergency (Enterprise only): +1-555-JOBPILOT
