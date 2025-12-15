# OAuth Integration Setup Guide

This guide will help you set up LinkedIn and GitHub OAuth authentication for the ApplyForUs platform.

## Prerequisites

Before you begin, make sure you have:
- Node.js and npm installed
- Access to LinkedIn and GitHub developer consoles
- Auth service running locally or deployed

## Package Installation

The auth service requires the following OAuth packages:

```bash
cd services/auth-service
npm install passport-github2 @types/passport-github2
```

These packages are already listed in package.json:
- `passport-linkedin-oauth2` - LinkedIn OAuth strategy
- `passport-github2` - GitHub OAuth strategy (needs to be installed)

## OAuth Provider Setup

### 1. Google OAuth (Already Configured)

Google OAuth is already set up. Make sure your `.env` file has:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8001/api/v1/auth/google/callback
```

### 2. LinkedIn OAuth Setup

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the application details:
   - App name: ApplyForUs
   - LinkedIn Page: Select your company page or create one
   - Privacy policy URL: Your privacy policy URL
   - App logo: Upload your logo
4. Click "Create app"
5. Go to the "Auth" tab
6. Add redirect URLs:
   - Development: `http://localhost:8001/api/v1/auth/linkedin/callback`
   - Production: `https://your-domain.com/api/v1/auth/linkedin/callback`
7. In the "Products" tab, request access to "Sign In with LinkedIn"
8. Copy your Client ID and Client Secret
9. Update your `.env` file:

```env
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:8001/api/v1/auth/linkedin/callback
```

### 3. GitHub OAuth Setup

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: ApplyForUs
   - Homepage URL: `http://localhost:3000` (for development)
   - Authorization callback URL: `http://localhost:8001/api/v1/auth/github/callback`
4. Click "Register application"
5. Click "Generate a new client secret"
6. Copy your Client ID and Client Secret
7. Update your `.env` file:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8001/api/v1/auth/github/callback
```

## Frontend Configuration

Update your frontend `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

## Testing OAuth Flow

### 1. Start the Services

```bash
# Terminal 1: Start auth service
cd services/auth-service
npm run start:dev

# Terminal 2: Start frontend
cd apps/web
npm run dev
```

### 2. Test Social Login

1. Navigate to http://localhost:3000/login
2. Click on "Continue with Google/LinkedIn/GitHub"
3. You should be redirected to the provider's login page
4. After authorization, you should be redirected back to the app
5. Check that you're logged in and redirected to the dashboard

### 3. Test Account Linking

1. Log in to your account
2. Navigate to Settings > Connected Accounts
3. Try connecting/disconnecting social accounts
4. Verify that the connections are saved correctly

## Troubleshooting

### LinkedIn OAuth Issues

**Problem**: "redirect_uri_mismatch" error
**Solution**: Make sure the callback URL in LinkedIn app settings exactly matches the `LINKEDIN_CALLBACK_URL` in your `.env` file

**Problem**: Email not provided
**Solution**: Ensure your LinkedIn app has requested "r_emailaddress" scope and the user's LinkedIn account has a verified email

### GitHub OAuth Issues

**Problem**: "redirect_uri_mismatch" error
**Solution**: Make sure the Authorization callback URL in GitHub app settings exactly matches the `GITHUB_CALLBACK_URL` in your `.env` file

**Problem**: Email not provided
**Solution**: Ensure the user has at least one public email address in their GitHub settings, or that they've granted email scope permission

### General OAuth Issues

**Problem**: "CORS error"
**Solution**: Ensure `CORS_ORIGINS` in auth service `.env` includes your frontend URL (e.g., `http://localhost:3000`)

**Problem**: Tokens not stored
**Solution**: Check browser console for errors. Ensure the callback page at `/oauth/callback` is working correctly

**Problem**: User not redirected after OAuth
**Solution**: Check that `FRONTEND_URL` is correctly set in auth service `.env` (default: `http://localhost:3000`)

## Production Deployment

### 1. Update Callback URLs

For each OAuth provider, add production callback URLs:
- Google: `https://api.your-domain.com/api/v1/auth/google/callback`
- LinkedIn: `https://api.your-domain.com/api/v1/auth/linkedin/callback`
- GitHub: `https://api.your-domain.com/api/v1/auth/github/callback`

### 2. Update Environment Variables

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
API_BASE_URL=https://api.your-domain.com
CORS_ORIGINS=https://your-domain.com

# Update callback URLs to production URLs
GOOGLE_CALLBACK_URL=https://api.your-domain.com/api/v1/auth/google/callback
LINKEDIN_CALLBACK_URL=https://api.your-domain.com/api/v1/auth/linkedin/callback
GITHUB_CALLBACK_URL=https://api.your-domain.com/api/v1/auth/github/callback
```

### 3. Security Considerations

- Use HTTPS in production
- Keep OAuth client secrets secure (use secrets management)
- Regularly rotate OAuth client secrets
- Monitor OAuth usage for suspicious activity
- Implement rate limiting on OAuth endpoints

## API Endpoints

### Initiate OAuth Login
- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/linkedin` - Start LinkedIn OAuth flow
- `GET /auth/github` - Start GitHub OAuth flow

### OAuth Callbacks
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/linkedin/callback` - LinkedIn OAuth callback
- `GET /auth/github/callback` - GitHub OAuth callback

### Account Management
- `GET /auth/me` - Get current user profile
- `POST /auth/oauth/disconnect` - Disconnect OAuth provider (requires authentication)

## Features Implemented

- Social login with Google, LinkedIn, and GitHub
- Account linking (connect multiple OAuth providers to one account)
- Account creation via OAuth
- Profile data sync (name, email, profile picture)
- Error handling and user-friendly error messages
- Secure token handling
- Session management

## Next Steps

1. Install the passport-github2 package
2. Set up OAuth apps on each provider's developer console
3. Update environment variables with your credentials
4. Test the complete OAuth flow
5. Monitor logs for any errors or issues
