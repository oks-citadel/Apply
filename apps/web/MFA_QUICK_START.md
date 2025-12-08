# MFA Quick Start Guide

## For Users

### How to Enable 2FA

1. Log in to your account
2. Go to **Settings** → **Security**
3. Click **"Enable 2FA"** button
4. Scan the QR code with your authenticator app:
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password
   - Any TOTP-compatible app
5. Enter the 6-digit code from your app
6. Click **"Verify & Enable"**
7. Done! Your account is now protected with 2FA

### How to Log In with 2FA

1. Enter your email and password as usual
2. Click **"Sign In"**
3. You'll see a new screen asking for a verification code
4. Open your authenticator app
5. Enter the 6-digit code shown for JobPilot
6. Click **"Verify and Sign In"**
7. You're logged in!

### How to Disable 2FA

1. Go to **Settings** → **Security**
2. Click **"Disable 2FA"** button
3. Read the security warning
4. Enter the current 6-digit code from your authenticator app
5. Click **"Disable 2FA"**
6. Done! 2FA is now disabled

## For Developers

### Component Locations

```
apps/web/src/
├── components/
│   ├── auth/
│   │   └── MfaVerification.tsx          # MFA verification screen
│   └── ui/
│       └── TOTPInput.tsx                 # 6-digit code input
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── page.tsx                  # MFA settings UI
├── lib/
│   └── api/
│       └── auth.ts                       # MFA API calls
├── stores/
│   └── authStore.ts                      # MFA state management
└── types/
    ├── auth.ts                           # Auth types
    └── user.ts                           # User types
```

### Quick Integration Example

```tsx
// 1. Use in your login form
import { MfaVerification } from '@/components/auth/MfaVerification';
import { useAuthStore } from '@/stores/authStore';

function LoginForm() {
  const [showMfa, setShowMfa] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { login, verifyMfaLogin } = useAuthStore();

  const handleLogin = async (credentials) => {
    const result = await login(credentials);

    if (result.requiresMfa) {
      setTempToken(result.tempToken);
      setShowMfa(true);
    } else {
      // Login successful
      router.push('/dashboard');
    }
  };

  const handleMfaVerify = async (code) => {
    await verifyMfaLogin(tempToken, code);
    router.push('/dashboard');
  };

  if (showMfa) {
    return <MfaVerification onVerify={handleMfaVerify} />;
  }

  return <YourLoginForm onSubmit={handleLogin} />;
}

// 2. Use TOTP input anywhere
import { TOTPInput } from '@/components/ui/TOTPInput';

function MyComponent() {
  const [code, setCode] = useState('');

  return (
    <TOTPInput
      value={code}
      onChange={setCode}
      onComplete={(code) => console.log('Code entered:', code)}
      autoFocus
    />
  );
}

// 3. Setup MFA in settings
import { useSetupMfa, useVerifyMfa } from '@/hooks/useAuth';

function SecuritySettings() {
  const setupMfa = useSetupMfa();
  const verifyMfa = useVerifyMfa();

  const handleSetup = async () => {
    const result = await setupMfa.mutateAsync();
    // result.qrCode - QR code data URL
    // result.secret - Manual entry code
  };

  const handleVerify = async (code) => {
    await verifyMfa.mutateAsync(code);
    // MFA is now enabled
  };
}
```

### API Endpoints

```typescript
// Setup MFA
POST /auth/mfa/setup
Response: { secret, qrCode, otpauthUrl }

// Verify MFA during setup
POST /auth/mfa/verify
Body: { token: "123456" }
Response: { message: "MFA enabled successfully" }

// Disable MFA
POST /auth/mfa/disable
Body: { token: "123456" }
Response: { message: "MFA disabled successfully" }

// Login with MFA
POST /auth/login
Body: { email, password }
Response: { requiresMfa: true, tempToken: "xxx" } OR { user, accessToken, refreshToken }

// Verify MFA during login
POST /auth/mfa/login
Body: { tempToken: "xxx", code: "123456" }
Response: { user, accessToken, refreshToken }
```

### Environment Variables

No additional environment variables needed. MFA uses the existing auth service configuration.

### Testing

```bash
# Start the development server
npm run dev

# Navigate to http://localhost:3000/settings
# Enable 2FA and test the flow

# Test login with 2FA enabled
# 1. Enable MFA for a test user
# 2. Log out
# 3. Log back in and verify MFA prompt appears
```

### Common Customizations

#### Custom TOTP Input Length
```tsx
<TOTPInput length={8} value={code} onChange={setCode} />
```

#### Custom Styling
```tsx
<TOTPInput
  value={code}
  onChange={setCode}
  className="custom-class"
/>
```

#### Custom Error Messages
```tsx
<MfaVerification
  onVerify={handleVerify}
  error="Custom error message"
/>
```

## Support

For detailed implementation information, see [MFA_IMPLEMENTATION.md](./MFA_IMPLEMENTATION.md)

For issues:
1. Check browser console for errors
2. Verify backend is running
3. Check API responses in Network tab
4. Review auth store state in Redux DevTools
