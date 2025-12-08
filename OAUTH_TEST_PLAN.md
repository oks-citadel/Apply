# OAuth Integration Test Plan

## Pre-Testing Setup

### 1. Install Dependencies
```bash
cd services/auth-service
npm install passport-github2 @types/passport-github2
```

### 2. Configure OAuth Apps
- [ ] LinkedIn OAuth app created and configured
- [ ] GitHub OAuth app created and configured
- [ ] Google OAuth app already configured
- [ ] All callback URLs added to provider settings
- [ ] Client IDs and secrets added to `.env` files

### 3. Start Services
```bash
# Terminal 1
cd services/auth-service
npm run start:dev

# Terminal 2
cd apps/web
npm run dev
```

---

## Test Suite 1: Basic OAuth Flows

### Test 1.1: Google OAuth Login (New User)
**Steps:**
1. Clear browser data or use incognito mode
2. Navigate to http://localhost:3000/login
3. Click "Continue with Google"
4. Complete Google OAuth authorization
5. Grant requested permissions

**Expected Results:**
- [ ] Redirected to Google login page
- [ ] Redirected back to app after authorization
- [ ] OAuth callback page shows "Authenticating..." then "Success!"
- [ ] Redirected to dashboard
- [ ] User is logged in
- [ ] User profile shows data from Google (name, email, profile picture)

### Test 1.2: LinkedIn OAuth Login (New User)
**Steps:**
1. Clear browser data or use incognito mode
2. Navigate to http://localhost:3000/login
3. Click "Continue with LinkedIn"
4. Complete LinkedIn OAuth authorization
5. Grant requested permissions

**Expected Results:**
- [ ] Redirected to LinkedIn login page
- [ ] Redirected back to app after authorization
- [ ] OAuth callback page shows success
- [ ] Redirected to dashboard
- [ ] User is logged in
- [ ] User profile shows data from LinkedIn

### Test 1.3: GitHub OAuth Login (New User)
**Steps:**
1. Clear browser data or use incognito mode
2. Navigate to http://localhost:3000/login
3. Click "Continue with GitHub"
4. Complete GitHub OAuth authorization
5. Grant requested permissions

**Expected Results:**
- [ ] Redirected to GitHub login page
- [ ] Redirected back to app after authorization
- [ ] OAuth callback page shows success
- [ ] Redirected to dashboard
- [ ] User is logged in
- [ ] User profile shows data from GitHub

---

## Test Suite 2: Account Linking

### Test 2.1: Link Google to Existing Account
**Steps:**
1. Register account with email/password (test@example.com)
2. Log in with email/password
3. Go to Settings > Connected Accounts
4. Click "Connect" on Google
5. Complete OAuth with Google account (using same email)

**Expected Results:**
- [ ] Redirected to Google OAuth
- [ ] Successfully authorized
- [ ] Redirected back to Connected Accounts page
- [ ] Google account shows as "Connected"
- [ ] Green checkmark and "Connected" badge visible
- [ ] Can now log in with Google using the same email

### Test 2.2: Link LinkedIn to Existing Account
**Steps:**
1. Use account from Test 2.1
2. Go to Settings > Connected Accounts
3. Click "Connect" on LinkedIn
4. Complete OAuth with LinkedIn account (using same email)

**Expected Results:**
- [ ] Redirected to LinkedIn OAuth
- [ ] Successfully authorized
- [ ] Redirected back to Connected Accounts page
- [ ] LinkedIn account shows as "Connected"
- [ ] Can now log in with LinkedIn

### Test 2.3: Link GitHub to Existing Account
**Steps:**
1. Use account from Test 2.1
2. Go to Settings > Connected Accounts
3. Click "Connect" on GitHub
4. Complete OAuth with GitHub account (using same email)

**Expected Results:**
- [ ] Redirected to GitHub OAuth
- [ ] Successfully authorized
- [ ] Redirected back to Connected Accounts page
- [ ] GitHub account shows as "Connected"
- [ ] Can now log in with GitHub

---

## Test Suite 3: Account Disconnection

### Test 3.1: Disconnect OAuth (With Password)
**Steps:**
1. Use account with password + OAuth connected
2. Go to Settings > Connected Accounts
3. Click "Disconnect" on connected provider
4. Confirm action

**Expected Results:**
- [ ] Loading state shown during disconnection
- [ ] Success toast notification appears
- [ ] Page refreshes
- [ ] Provider shows as "Not Connected"
- [ ] Can still log in with password

### Test 3.2: Prevent Disconnect (No Password)
**Steps:**
1. Create account using OAuth only (no password)
2. Go to Settings > Connected Accounts
3. Try to disconnect the only OAuth provider

**Expected Results:**
- [ ] Error message shown
- [ ] Message explains: "Cannot disconnect OAuth provider. Please set a password first to maintain account access."
- [ ] Account remains connected
- [ ] User can still log in

### Test 3.3: Reconnect After Disconnect
**Steps:**
1. Use account from Test 3.1 (disconnected OAuth)
2. Go to Settings > Connected Accounts
3. Click "Connect" on previously disconnected provider
4. Complete OAuth flow

**Expected Results:**
- [ ] Successfully reconnected
- [ ] Provider shows as "Connected"
- [ ] Can log in with this provider again

---

## Test Suite 4: Error Handling

### Test 4.1: User Denies OAuth Permission
**Steps:**
1. Navigate to login page
2. Click social login button
3. On OAuth provider page, click "Cancel" or "Deny"

**Expected Results:**
- [ ] Redirected to OAuth callback page
- [ ] Error message displayed: "You denied access to [Provider]. To sign in with [Provider], you need to grant the required permissions."
- [ ] Automatically redirected to login page after 4 seconds
- [ ] No account created
- [ ] User can try again

### Test 4.2: OAuth Callback Error
**Steps:**
1. Manually navigate to callback URL with error parameters:
   `http://localhost:3000/oauth/callback?error=access_denied&error_description=User+cancelled`

**Expected Results:**
- [ ] Error icon displayed (red AlertCircle)
- [ ] User-friendly error message shown
- [ ] Redirected to login page after delay
- [ ] No tokens stored

### Test 4.3: Missing Email from Provider
**Steps:**
1. Try OAuth with account that doesn't have email verified
   OR
2. Modify strategy to simulate missing email

**Expected Results:**
- [ ] Error handled gracefully
- [ ] Error message: "[Provider] did not provide your email address..."
- [ ] User redirected back to login
- [ ] No account created

### Test 4.4: Network Error During OAuth
**Steps:**
1. Start OAuth flow
2. Disconnect internet before callback completes
3. Restore connection

**Expected Results:**
- [ ] Error caught and handled
- [ ] User-friendly error message shown
- [ ] User can retry OAuth flow
- [ ] No corrupted data stored

---

## Test Suite 5: UI/UX Testing

### Test 5.1: Social Login Buttons Visibility
**Steps:**
1. Check login page
2. Check register page

**Expected Results:**
- [ ] Social login buttons visible on both pages
- [ ] Buttons appear below main action button
- [ ] "Or continue with" divider shown
- [ ] All three provider buttons (Google, LinkedIn, GitHub) visible
- [ ] Proper icons displayed for each provider
- [ ] Buttons have hover states
- [ ] Buttons respect loading state

### Test 5.2: Connected Accounts Page UI
**Steps:**
1. Navigate to Settings > Connected Accounts
2. Check UI elements

**Expected Results:**
- [ ] Page title and description visible
- [ ] Security notice banner shown (blue info banner)
- [ ] All three providers listed in cards
- [ ] Each card shows provider icon, name, description
- [ ] Connection status badge visible (Connected/Not Connected)
- [ ] Appropriate action button (Connect/Disconnect)
- [ ] Yellow warning card at bottom
- [ ] All elements properly styled and responsive

### Test 5.3: OAuth Callback Page States
**Steps:**
1. Complete OAuth flow and observe callback page states

**Expected Results:**
- [ ] Loading state: Spinner + "Authenticating..." message
- [ ] Success state: Green checkmark + "Success!" message
- [ ] Error state: Red alert icon + error message
- [ ] All states centered and properly styled
- [ ] Automatic redirects work correctly

---

## Test Suite 6: Cross-Browser Testing

### Test 6.1: Chrome/Edge
- [ ] All OAuth flows work
- [ ] Tokens stored correctly
- [ ] Redirects work properly
- [ ] UI renders correctly

### Test 6.2: Firefox
- [ ] All OAuth flows work
- [ ] Tokens stored correctly
- [ ] Redirects work properly
- [ ] UI renders correctly

### Test 6.3: Safari
- [ ] All OAuth flows work
- [ ] Tokens stored correctly
- [ ] Redirects work properly
- [ ] UI renders correctly

---

## Test Suite 7: Security Testing

### Test 7.1: Token Security
**Steps:**
1. Complete OAuth flow
2. Check browser storage

**Expected Results:**
- [ ] Tokens not visible in localStorage (check implementation)
- [ ] Tokens handled securely
- [ ] Refresh tokens stored as httpOnly cookies (if implemented)
- [ ] No sensitive data in browser console logs

### Test 7.2: CORS Configuration
**Steps:**
1. Try OAuth flow from different origin
2. Check network tab for CORS headers

**Expected Results:**
- [ ] CORS errors if origin not allowed
- [ ] Successful requests from allowed origins
- [ ] Proper CORS headers in responses

### Test 7.3: Callback URL Validation
**Steps:**
1. Try accessing callback endpoints directly
2. Try with invalid parameters

**Expected Results:**
- [ ] Invalid callbacks handled gracefully
- [ ] No server crashes
- [ ] Proper error messages returned

---

## Test Suite 8: Integration Testing

### Test 8.1: Login with Different Providers
**Steps:**
1. Log in with Google
2. Log out
3. Log in with same email using LinkedIn
4. Log out
5. Log in with password

**Expected Results:**
- [ ] All login methods work for same account
- [ ] Profile data consistent across logins
- [ ] Sessions managed correctly
- [ ] No conflicts between providers

### Test 8.2: Switch Between Accounts
**Steps:**
1. Log in with OAuth account A
2. Log out
3. Log in with OAuth account B
4. Verify data

**Expected Results:**
- [ ] Correct user data for each account
- [ ] No data leakage between accounts
- [ ] Sessions properly cleared

---

## Test Suite 9: Edge Cases

### Test 9.1: OAuth with Existing Email (Different Provider)
**Steps:**
1. Create account with email@example.com using password
2. Try to sign up with LinkedIn using same email

**Expected Results:**
- [ ] LinkedIn account linked to existing account
- [ ] No duplicate account created
- [ ] User can now log in with both methods
- [ ] Profile data merged appropriately

### Test 9.2: Rapid OAuth Attempts
**Steps:**
1. Click social login button multiple times rapidly
2. Cancel OAuth and immediately retry

**Expected Results:**
- [ ] No duplicate requests sent
- [ ] Loading state prevents multiple clicks
- [ ] Graceful handling of cancellations
- [ ] No corrupted state

### Test 9.3: Browser Back Button During OAuth
**Steps:**
1. Start OAuth flow
2. On provider page, click browser back button
3. Try OAuth again

**Expected Results:**
- [ ] OAuth state cleared properly
- [ ] Can successfully retry OAuth
- [ ] No stale state issues

---

## Test Suite 10: Performance Testing

### Test 10.1: OAuth Flow Speed
**Steps:**
1. Measure time from click to dashboard
2. Test with different providers

**Expected Results:**
- [ ] Complete flow under 5 seconds (with fast connection)
- [ ] Callback processing under 1 second
- [ ] Token generation under 500ms
- [ ] Smooth user experience, no long loading times

### Test 10.2: Concurrent OAuth Requests
**Steps:**
1. Have multiple users attempt OAuth simultaneously
2. Monitor server performance

**Expected Results:**
- [ ] All requests handled correctly
- [ ] No database conflicts
- [ ] Response times remain acceptable
- [ ] No server crashes

---

## Test Result Summary

| Test Suite | Pass | Fail | Notes |
|------------|------|------|-------|
| 1. Basic OAuth Flows | ☐ | ☐ | |
| 2. Account Linking | ☐ | ☐ | |
| 3. Account Disconnection | ☐ | ☐ | |
| 4. Error Handling | ☐ | ☐ | |
| 5. UI/UX Testing | ☐ | ☐ | |
| 6. Cross-Browser | ☐ | ☐ | |
| 7. Security | ☐ | ☐ | |
| 8. Integration | ☐ | ☐ | |
| 9. Edge Cases | ☐ | ☐ | |
| 10. Performance | ☐ | ☐ | |

---

## Known Issues

Document any issues found during testing:

1. **Issue:** [Description]
   - **Severity:** Low/Medium/High/Critical
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Status:** Open/In Progress/Resolved

---

## Test Environment

- **Frontend URL:** http://localhost:3000
- **Backend URL:** http://localhost:8001
- **Node Version:** [Your version]
- **Browser:** [Your browser and version]
- **OS:** [Your OS]
- **Date Tested:** [Date]

---

## Sign-off

- [ ] All critical tests passed
- [ ] All security tests passed
- [ ] All providers working correctly
- [ ] Error handling verified
- [ ] UI/UX acceptable
- [ ] Ready for production deployment

**Tested by:** _______________
**Date:** _______________
**Approved by:** _______________
**Date:** _______________
