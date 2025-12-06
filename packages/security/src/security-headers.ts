import helmet from 'helmet';
import { RequestHandler } from 'express';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean | helmet.ContentSecurityPolicyOptions;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  hsts?: boolean | helmet.StrictTransportSecurityOptions;
  noSniff?: boolean;
  frameguard?: boolean | helmet.XFrameOptionsOptions;
  xssFilter?: boolean;
}

const defaultConfig: helmet.HelmetOptions = {
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
  const helmetConfig: helmet.HelmetOptions = {
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
