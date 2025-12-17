# MFA Flow Diagrams

## Login Flow with MFA

```
┌─────────────────────────────────────────────────────────────────┐
│                          LOGIN PAGE                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User enters email/password
                              ▼
                    ┌──────────────────┐
                    │  POST /auth/login │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
         ┌──────────▼──────────┐   ┌───▼────────────────┐
         │  MFA Not Enabled    │   │   MFA Enabled      │
         │  Return:            │   │   Return:          │
         │  - user             │   │   - requiresMfa    │
         │  - accessToken      │   │   - tempToken      │
         │  - refreshToken     │   │   - message        │
         └──────────┬──────────┘   └───┬────────────────┘
                    │                  │
                    │                  │
         ┌──────────▼──────────┐      │
         │  Redirect to        │      │
         │  /dashboard         │      │
         └─────────────────────┘      │
                                      │
                         ┌────────────▼───────────────┐
                         │  Show MfaVerification     │
                         │  Component                │
                         └────────────┬───────────────┘
                                      │
                                      │ User enters TOTP code
                                      ▼
                         ┌─────────────────────────┐
                         │ POST /auth/mfa/login    │
                         │ Body:                   │
                         │  - tempToken            │
                         │  - code                 │
                         └─────────────┬───────────┘
                                       │
                          ┌────────────┴──────────┐
                          │                       │
                ┌─────────▼─────────┐   ┌────────▼────────┐
                │  Code Valid       │   │  Code Invalid   │
                │  Return:          │   │  Show Error     │
                │  - user           │   │  Let user retry │
                │  - accessToken    │   └─────────────────┘
                │  - refreshToken   │
                └─────────┬─────────┘
                          │
                          │
                ┌─────────▼─────────┐
                │  Redirect to      │
                │  /dashboard       │
                └───────────────────┘
```

## MFA Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SETTINGS > SECURITY                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks "Enable 2FA"
                              ▼
                    ┌──────────────────────┐
                    │  Show Setup Modal    │
                    │  Step 1: Info        │
                    └──────────┬───────────┘
                               │
                               │ User clicks "Continue"
                               ▼
                    ┌──────────────────────┐
                    │ POST /auth/mfa/setup │
                    └──────────┬───────────┘
                               │
                               │ Response:
                               │  - secret
                               │  - qrCode
                               │  - otpauthUrl
                               ▼
                    ┌──────────────────────────┐
                    │  Show Setup Modal        │
                    │  Step 2: Scan QR Code    │
                    │  + TOTPInput             │
                    └──────────┬───────────────┘
                               │
                               │ User scans QR & enters code
                               ▼
                    ┌──────────────────────────┐
                    │ POST /auth/mfa/verify    │
                    │ Body: { token: "123456" }│
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴────────────┐
                    │                       │
          ┌─────────▼─────────┐   ┌────────▼────────┐
          │  Code Valid       │   │  Code Invalid   │
          │  MFA Enabled      │   │  Show Error     │
          │  Close Modal      │   │  Let user retry │
          │  Show Success     │   └─────────────────┘
          └───────────────────┘
```

## MFA Disable Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SETTINGS > SECURITY                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ User clicks "Disable 2FA"
                              ▼
                    ┌──────────────────────────┐
                    │  Show Disable Modal      │
                    │  Warning Message         │
                    │  TOTPInput               │
                    └──────────┬───────────────┘
                               │
                               │ User enters current code
                               ▼
                    ┌──────────────────────────┐
                    │ POST /auth/mfa/disable   │
                    │ Body: { token: "123456" }│
                    └──────────┬───────────────┘
                               │
                    ┌──────────┴────────────┐
                    │                       │
          ┌─────────▼─────────┐   ┌────────▼────────┐
          │  Code Valid       │   │  Code Invalid   │
          │  MFA Disabled     │   │  Show Error     │
          │  Close Modal      │   │  Let user retry │
          │  Show Success     │   └─────────────────┘
          └───────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYOUT                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  Login Page   │   │   Settings   │   │  Dashboard   │
└───────┬───────┘   └──────┬───────┘   └──────────────┘
        │                  │
        │                  │
        │            ┌─────┴─────┐
        │            │           │
        │            ▼           ▼
        │    ┌──────────────┐  ┌────────────────┐
        │    │ Setup Modal  │  │ Disable Modal  │
        │    └──────┬───────┘  └────┬───────────┘
        │           │               │
        │           └───────┬───────┘
        │                   │
        │    ┌──────────────▼──────────────┐
        │    │      TOTPInput Component    │
        │    │  (Reusable 6-digit input)   │
        │    └─────────────────────────────┘
        │
        │
┌───────▼────────────────────┐
│  MfaVerification Component │
│  - Shield Icon             │
│  - Email Display           │
│  - TOTPInput               │
│  - Submit/Cancel Buttons   │
└────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTH STORE (Zustand)                    │
│                                                              │
│  State:                                                      │
│  ├── user: User | null                                      │
│  ├── isAuthenticated: boolean                               │
│  ├── isLoading: boolean                                     │
│  ├── accessToken: string | null                             │
│  ├── refreshToken: string | null                            │
│  ├── mfaRequired: boolean          ← NEW                    │
│  └── mfaTempToken: string | null   ← NEW                    │
│                                                              │
│  Actions:                                                    │
│  ├── login(credentials)            ← ENHANCED               │
│  ├── verifyMfaLogin(token, code)   ← NEW                    │
│  ├── logout()                                               │
│  ├── resetMfaState()               ← NEW                    │
│  └── updateUser(data)                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────┐
│  LoginForm    │   │   Settings   │   │  Protected   │
│  Component    │   │   Component  │   │   Routes     │
└───────────────┘   └──────────────┘   └──────────────┘
```

## API Integration

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls via axios
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Client Layer                          │
│                    (lib/api/auth.ts)                         │
│                                                              │
│  Methods:                                                    │
│  ├── login(credentials)                                     │
│  ├── verifyMfaLogin(tempToken, code)                        │
│  ├── setupMfa()                                             │
│  ├── verifyMfa(code)                                        │
│  └── disableMfa(code)                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (NestJS Auth Service)                │
│                                                              │
│  Endpoints:                                                  │
│  ├── POST /auth/login                                       │
│  ├── POST /auth/mfa/login                                   │
│  ├── POST /auth/mfa/setup                                   │
│  ├── POST /auth/mfa/verify                                  │
│  └── POST /auth/mfa/disable                                 │
└─────────────────────────────────────────────────────────────┘
```

## User Journey Map

### New User Enabling MFA

```
1. Sign up / Log in
   └─> Dashboard

2. Navigate to Settings
   └─> Security Tab
       └─> See "2FA Disabled" status

3. Click "Enable 2FA"
   └─> Modal opens
       └─> Read instructions
           └─> Click "Continue"

4. Backend generates QR code
   └─> QR code displayed
       └─> Manual secret shown as backup

5. Open authenticator app
   └─> Scan QR code
       └─> Code appears in app

6. Enter 6-digit code
   └─> Code auto-validates
       └─> MFA enabled!

7. See "2FA Enabled" status
   └─> Shield icon turns green
```

### Existing User with MFA Logging In

```
1. Visit login page
   └─> Enter email/password
       └─> Click "Sign In"

2. Backend checks MFA status
   └─> MFA is enabled
       └─> Returns requiresMfa = true

3. UI switches to MFA screen
   └─> Shows user's email
       └─> Shows TOTP input
           └─> Auto-focuses first digit

4. User opens authenticator app
   └─> Finds JobPilot code
       └─> Enters 6 digits

5. Code auto-submits or manual submit
   └─> Backend verifies
       └─> Login successful!

6. Redirect to dashboard
   └─> User is authenticated
```

## Security Flow

```
                        ┌─────────────────┐
                        │  User Device    │
                        └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
                    ▼                         ▼
         ┌─────────────────┐      ┌──────────────────┐
         │ Enter Password  │      │ Authenticator App│
         │ (Something you  │      │ (Something you   │
         │  know)          │      │  have)           │
         └────────┬────────┘      └────────┬─────────┘
                  │                        │
                  │                        │
                  └──────────┬─────────────┘
                             │
                             ▼
                  ┌──────────────────┐
                  │  Both Required   │
                  │  for Access      │
                  └──────────────────┘
                             │
                             ▼
                  ┌──────────────────┐
                  │  Access Granted  │
                  └──────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Action                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │   API Request    │
                  └────────┬─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Success    │  │ Client Error │  │ Server Error │
│   (200-299)  │  │   (400-499)  │  │   (500-599)  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Show Success │  │  Show Error  │  │  Show Error  │
│   Message    │  │  Below Input │  │   + Retry    │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                         │ Invalid Code?
                         ▼
                  ┌──────────────┐
                  │ Clear Input  │
                  │ Let user     │
                  │ try again    │
                  └──────────────┘
```

## Component Hierarchy

```
App
│
├── Login Page
│   └── LoginForm
│       └── MfaVerification (conditional)
│           └── TOTPInput
│
└── Dashboard
    └── Settings Page
        └── SecuritySettings
            ├── Password Change Form
            ├── MFA Toggle Button
            ├── TwoFactorSetupModal (conditional)
            │   └── TOTPInput
            └── TwoFactorDisableModal (conditional)
                └── TOTPInput
```
