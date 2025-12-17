# OAuth Integration - Quick Start Guide

## Installation & Setup (5 minutes)

### Step 1: Install Required Package

```bash
cd services/auth-service
npm install passport-github2 @types/passport-github2
```

### Step 2: Configure Environment Variables

Create or update `services/auth-service/.env`:

```env
# LinkedIn OAuth (Get from: https://www.linkedin.com/developers/apps)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:8001/api/v1/auth/linkedin/callback

# GitHub OAuth (Get from: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8001/api/v1/auth/github/callback

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start Services

```bash
# Terminal 1: Auth Service
cd services/auth-service
npm run start:dev

# Terminal 2: Frontend
cd apps/web
npm run dev
```

### Step 4: Test OAuth

1. Open http://localhost:3000/login
2. Click "Continue with LinkedIn" or "Continue with GitHub"
3. Authorize the application
4. You should be redirected back and logged in

---

## OAuth Provider Setup

### LinkedIn OAuth App

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in details:
   - App name: JobPilot
   - Company page: Select or create one
   - Privacy policy: Your privacy policy URL
4. In "Auth" tab, add redirect URL: `http://localhost:8001/api/v1/auth/linkedin/callback`
5. In "Products" tab, request "Sign In with LinkedIn"
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - Application name: JobPilot
   - Homepage URL: http://localhost:3000
   - Callback URL: http://localhost:8001/api/v1/auth/github/callback
4. Click "Generate a new client secret"
5. Copy Client ID and Client Secret to `.env`

---

## What Was Implemented

### Backend (auth-service)
- LinkedIn OAuth strategy
- GitHub OAuth strategy
- OAuth callback endpoints with error handling
- Account disconnect endpoint
- User entity support for GitHub provider

### Frontend (apps/web)
- Social login buttons component
- OAuth callback handler page
- Account linking settings page
- Error handling utilities

---

## Testing OAuth Flows

### Test Social Login
1. Go to login page
2. Click social login button
3. Complete OAuth flow
4. Verify redirect to dashboard

### Test Account Linking
1. Log in with email/password
2. Go to Settings > Connected Accounts
3. Click "Connect" on a social provider
4. Complete OAuth flow
5. Verify connection status updates

### Test Account Disconnect
1. Go to Settings > Connected Accounts
2. Click "Disconnect" on connected account
3. Verify disconnection (requires password to be set)

---

## API Endpoints

### Start OAuth Flow
- `GET /auth/google` - Google OAuth
- `GET /auth/linkedin` - LinkedIn OAuth
- `GET /auth/github` - GitHub OAuth

### OAuth Callbacks (automatic)
- `GET /auth/google/callback`
- `GET /auth/linkedin/callback`
- `GET /auth/github/callback`

### Account Management
- `GET /auth/me` - Get current user (authenticated)
- `POST /auth/oauth/disconnect` - Disconnect OAuth (authenticated)

---

## Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution:** Ensure callback URL in provider settings EXACTLY matches the URL in your `.env` file (including http/https, port, and path)

### Issue: "Email not provided"
**Solution:**
- LinkedIn: Ensure your LinkedIn account has a verified email
- GitHub: Ensure you have a public email or grant email scope permission

### Issue: Tokens not stored
**Solution:** Check browser console for errors. Ensure `NEXT_PUBLIC_API_URL` is set correctly in frontend `.env.local`

### Issue: CORS error
**Solution:** Ensure `CORS_ORIGINS` in auth service `.env` includes your frontend URL (http://localhost:3000)

---

## File Locations

### Backend Files
- Strategies: `services/auth-service/src/modules/auth/strategies/`
- Controller: `services/auth-service/src/modules/auth/auth.controller.ts`
- Service: `services/auth-service/src/modules/auth/auth.service.ts`
- Config: `services/auth-service/src/config/configuration.ts`

### Frontend Files
- Login buttons: `apps/web/src/components/auth/SocialLoginButtons.tsx`
- Callback handler: `apps/web/src/app/(auth)/oauth/callback/page.tsx`
- Settings page: `apps/web/src/app/(dashboard)/settings/connected-accounts/page.tsx`
- Utilities: `apps/web/src/lib/oauth-utils.ts`

---

## Production Checklist

- [ ] Update OAuth callback URLs to production URLs
- [ ] Use HTTPS for all endpoints
- [ ] Store OAuth secrets in secure vault (Azure Key Vault, AWS Secrets Manager)
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Update `CORS_ORIGINS` to production frontend URL
- [ ] Enable OAuth rate limiting
- [ ] Set up OAuth error monitoring
- [ ] Test all OAuth flows in production
- [ ] Document OAuth setup for team

---

## Support

For detailed documentation, see:
- Full implementation guide: `OAUTH_INTEGRATION_COMPLETE.md`
- Setup guide: `services/auth-service/OAUTH_SETUP.md`

For issues or questions, check the troubleshooting section in `OAUTH_SETUP.md`
