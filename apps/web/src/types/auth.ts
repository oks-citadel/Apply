export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  mfaEnabled?: boolean;
  isEmailVerified?: boolean;
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
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
