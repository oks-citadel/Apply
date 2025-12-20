export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  mfaEnabled?: boolean;
  isMfaEnabled?: boolean;
  isEmailVerified?: boolean;
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'INACTIVE' | 'active' | 'pending_verification' | 'suspended' | 'inactive';
  authProvider?: 'local' | 'google' | 'linkedin' | 'github';
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MfaRequiredResponse {
  requiresMfa: true;
  tempToken: string;
  message: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type OAuthProvider = 'google' | 'linkedin' | 'github';

export interface OAuthCallbackParams {
  success?: string;
  error?: string;
  error_description?: string;
}

export interface OAuthUrlResponse {
  url: string;
}

export interface ConnectedAccount {
  provider: OAuthProvider;
  email: string;
  connectedAt: string;
}
