export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS || '*',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'applyforus_auth',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
    logging: process.env.DB_LOGGING === 'true' || false,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'applyforus-auth-service',
    audience: process.env.JWT_AUDIENCE || 'applyforus-platform',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
  },

  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    callbackUrl: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/linkedin/callback',
  },

  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/github/callback',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@applyforus.com',
  },

  // Password Configuration
  password: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' || true,
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' || true,
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true' || true,
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true' || true,
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },

  // MFA Configuration
  mfa: {
    enabled: process.env.MFA_ENABLED === 'true' || false,
    issuer: process.env.MFA_ISSUER || 'ApplyForUs AI',
    window: parseInt(process.env.MFA_WINDOW || '2', 10),
  },

  // Token Configuration
  tokens: {
    emailVerificationExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '86400', 10), // 24 hours
    passwordResetExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY || '3600', 10), // 1 hour
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900', 10), // 15 minutes
    csrfEnabled: process.env.CSRF_ENABLED === 'true' || true,
    csrfSecret: process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production',
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    hstsEnabled: process.env.HSTS_ENABLED !== 'false',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
  },
});
