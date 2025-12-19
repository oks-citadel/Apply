import helmet, { type HelmetOptions } from 'helmet';
import { RequestHandler } from 'express';

// Extract types from HelmetOptions
type ContentSecurityPolicyOptions = Extract<HelmetOptions['contentSecurityPolicy'], object>;
type StrictTransportSecurityOptions = Extract<HelmetOptions['hsts'], object>;
type XFrameOptionsOptions = Extract<HelmetOptions['frameguard'], object>;

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | ContentSecurityPolicyOptions;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  hsts?: boolean | StrictTransportSecurityOptions;
  noSniff?: boolean;
  frameguard?: boolean | XFrameOptionsOptions;
  xssFilter?: boolean;
}

const defaultConfig: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com'],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

export function createSecurityMiddleware(config: SecurityHeadersConfig = {}): RequestHandler {
  const helmetConfig: HelmetOptions = {
    ...defaultConfig,
  };

  if (config.contentSecurityPolicy === false) {
    helmetConfig.contentSecurityPolicy = false;
  }

  if (config.crossOriginEmbedderPolicy !== undefined) {
    helmetConfig.crossOriginEmbedderPolicy = config.crossOriginEmbedderPolicy;
  }

  if (config.crossOriginOpenerPolicy !== undefined) {
    helmetConfig.crossOriginOpenerPolicy = config.crossOriginOpenerPolicy;
  }

  if (config.crossOriginResourcePolicy !== undefined) {
    helmetConfig.crossOriginResourcePolicy = config.crossOriginResourcePolicy;
  }

  return helmet(helmetConfig);
}

export const securityHeaders = createSecurityMiddleware();

export function corsOptions(allowedOrigins: string[]) {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  };
}
