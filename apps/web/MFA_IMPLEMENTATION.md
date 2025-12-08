# MFA (Multi-Factor Authentication) Frontend Implementation

## Overview

This document describes the complete MFA implementation for the ApplyforUs (JobPilot) platform frontend. The implementation includes TOTP-based 2FA with QR code scanning and a seamless login flow.

## Features Implemented

### 1. MFA Setup Flow
- **Location**: Settings > Security
- **Features**:
  - QR code generation and display
  - Manual secret key entry option
  - Interactive 6-digit TOTP code input
  - Real-time validation during setup
  - Success confirmation

### 2. MFA Login Flow
- **Location**: Login page
- **Features**:
  - Automatic detection when MFA is required
  - Seamless transition to MFA verification screen
  - 6-digit TOTP code input with auto-focus
  - Back to login option
  - Error handling and user feedback

### 3. MFA Management
- **Location**: Settings > Security
- **Features**:
  - Enable/Disable MFA toggle
  - Visual status indicator (enabled/disabled)
  - Secure verification required for disable
  - Protected by current password

## Components Created

### 1. TOTPInput Component
**Path**: `apps/web/src/components/ui/TOTPInput.tsx`

A reusable 6-digit TOTP code input component with:
- Individual digit inputs
- Auto-focus and auto-advance
- Paste support
- Backspace navigation
- Keyboard navigation (arrow keys)
- Error state styling
- Dark mode support

**Usage**:
```tsx
import { TOTPInput } from '@/components/ui/TOTPInput';

<TOTPInput
  value={code}
  onChange={setCode}
  onComplete={(code) => handleVerify(code)}
  autoFocus
  error={errorMessage}
/>
```

### 2. MfaVerification Component
**Path**: `apps/web/src/components/auth/MfaVerification.tsx`

A dedicated MFA verification screen for login flow with:
- Shield icon and branded header
- Email display
- TOTP input integration
- Submit and cancel actions
- Loading states
- Error handling

**Usage**:
```tsx
import { MfaVerification } from '@/components/auth/MfaVerification';

<MfaVerification
  onVerify={handleMfaVerify}
  onCancel={handleCancelMfa}
  isLoading={isLoading}
  error={error}
  email={userEmail}
/>
```

## API Integration

### Auth API Updates
**Path**: `apps/web/src/lib/api/auth.ts`

#### New Endpoints:

1. **Login with MFA Support**
```typescript
login(credentials): Promise<AuthResponse | MfaRequiredResponse>
```
Returns either:
- `AuthResponse` - Regular login success
- `MfaRequiredResponse` - MFA verification required

2. **Verify MFA During Login**
```typescript
verifyMfaLogin(tempToken: string, code: string): Promise<AuthResponse>
```

3. **Setup MFA**
```typescript
setupMfa(): Promise<MfaSetup>
```
Returns:
- `secret` - TOTP secret key
- `qrCode` - Data URL for QR code image
- `otpauthUrl` - OTP auth URL

4. **Verify MFA Code (Setup)**
```typescript
verifyMfa(code: string): Promise<{ message: string }>
```

5. **Disable MFA**
```typescript
disableMfa(code?: string): Promise<{ message: string }>
```

## State Management

### Auth Store Updates
**Path**: `apps/web/src/stores/authStore.ts`

#### New State Properties:
```typescript
{
  mfaRequired: boolean;      // Whether MFA is required for current login
  mfaTempToken: string | null; // Temporary token for MFA verification
}
```

#### New Methods:

1. **login**: Enhanced to handle MFA responses
```typescript
login(credentials): Promise<{ requiresMfa: boolean; tempToken?: string }>
```

2. **verifyMfaLogin**: Complete MFA verification
```typescript
verifyMfaLogin(tempToken: string, code: string): Promise<void>
```

3. **resetMfaState**: Clear MFA-related state
```typescript
resetMfaState(): void
```

## Type Definitions

### Auth Types
**Path**: `apps/web/src/types/auth.ts`

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface MfaRequiredResponse {
  requiresMfa: true;
  tempToken: string;
  message: string;
}
```

### User Types
**Path**: `apps/web/src/types/user.ts`

```typescript
export interface MfaSetup {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export interface MfaVerifyResponse {
  message: string;
}
```

## User Flow

### Enabling MFA

1. User navigates to Settings > Security
2. Clicks "Enable 2FA" button
3. Modal opens with QR code and setup instructions
4. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
5. User enters 6-digit code from app
6. System verifies code and enables MFA
7. Success message displayed

### Login with MFA

1. User enters email and password
2. System checks if MFA is enabled
3. If MFA enabled:
   - Login request returns `MfaRequiredResponse`
   - UI switches to MFA verification screen
   - User enters 6-digit code
   - System verifies code
   - User is logged in
4. If MFA not enabled:
   - Regular login flow continues

### Disabling MFA

1. User navigates to Settings > Security
2. Clicks "Disable 2FA" button
3. Warning modal appears
4. User enters verification code
5. System verifies code and disables MFA
6. Success message displayed

## Settings Integration

### Security Settings Section
**Path**: `apps/web/src/app/(dashboard)/settings/page.tsx`

The security settings includes:
- Password change form
- MFA toggle with status indicator
- MFA setup modal
- MFA disable modal

Visual indicators:
- Green shield icon when enabled
- Gray shield icon when disabled
- Clear status text

## Backend Integration

### Endpoints Used

All endpoints are under `/auth/mfa`:

1. `POST /auth/mfa/setup` - Initialize MFA setup
2. `POST /auth/mfa/verify` - Verify and enable MFA
3. `POST /auth/mfa/disable` - Disable MFA
4. `POST /auth/mfa/login` - Verify MFA during login

### Authentication Flow

```
Login Request
    ↓
Backend checks user.isMfaEnabled
    ↓
If MFA enabled:
    → Return { requiresMfa: true, tempToken: "xxx" }
    → Frontend shows MFA screen
    → User enters code
    → POST /auth/mfa/login with tempToken + code
    → Backend verifies and returns tokens
    ↓
If MFA disabled:
    → Return normal AuthResponse
```

## Security Considerations

1. **Temporary Tokens**: Short-lived tokens used during MFA verification
2. **Rate Limiting**: Backend implements rate limiting on MFA endpoints
3. **Code Validation**: TOTP codes validated with time window
4. **Secure Storage**: Auth tokens stored securely in localStorage
5. **Error Messages**: Generic error messages to prevent enumeration

## Styling & UX

### Design Principles
- Clean, modern interface
- Clear visual feedback
- Accessible (ARIA labels, keyboard navigation)
- Dark mode support
- Mobile responsive

### Key UX Features
- Auto-focus on first input
- Auto-advance between digits
- Paste support for convenience
- Clear error states
- Loading indicators
- Success confirmations

## Testing Recommendations

### Manual Testing Checklist

1. **MFA Setup**
   - [ ] QR code displays correctly
   - [ ] Manual secret key visible
   - [ ] TOTP input works with authenticator app
   - [ ] Invalid codes show error
   - [ ] Valid codes enable MFA successfully

2. **MFA Login**
   - [ ] Login redirects to MFA screen when enabled
   - [ ] TOTP input accepts valid codes
   - [ ] Invalid codes show error
   - [ ] Cancel returns to login
   - [ ] Successful verification logs user in

3. **MFA Disable**
   - [ ] Warning message displays
   - [ ] Requires valid TOTP code
   - [ ] Successfully disables MFA
   - [ ] Next login doesn't require MFA

4. **Edge Cases**
   - [ ] Paste functionality works
   - [ ] Keyboard navigation works
   - [ ] Works on mobile devices
   - [ ] Dark mode displays correctly
   - [ ] Network errors handled gracefully

### Automated Testing

Consider adding tests for:
- TOTPInput component behavior
- MfaVerification component rendering
- Auth store MFA state management
- API integration with mocked responses

## Future Enhancements

1. **Backup Codes**: Generate and store backup codes for account recovery
2. **SMS 2FA**: Alternative 2FA method via SMS
3. **Biometric Auth**: Support for WebAuthn/FIDO2
4. **Remember Device**: Option to skip MFA on trusted devices
5. **Recovery Options**: Email-based recovery flow
6. **Activity Log**: Show when MFA was enabled/disabled
7. **Multiple Devices**: Manage multiple authenticator devices

## Troubleshooting

### Common Issues

**QR Code Not Scanning**
- Ensure QR code is clearly visible
- Try manual secret key entry
- Check authenticator app compatibility

**Invalid Code Errors**
- Verify device time is synchronized
- Check code hasn't expired (30-second window)
- Ensure typing correct 6-digit code

**Can't Disable MFA**
- Verify entering current TOTP code
- Check if authenticator app is in sync
- Contact support for account recovery

## Dependencies

- `react-hook-form` - Form management
- `zod` - Schema validation
- `zustand` - State management
- `@tanstack/react-query` - API data fetching
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Support

For issues or questions:
- Check backend logs for API errors
- Review browser console for frontend errors
- Verify environment variables are set correctly
- Ensure backend MFA service is running

## Conclusion

The MFA implementation provides a secure, user-friendly two-factor authentication system fully integrated with the ApplyforUs platform. All components are reusable, well-documented, and follow modern React best practices.
