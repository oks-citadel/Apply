import helmet, { type HelmetOptions } from 'helmet';
import { INestApplication } from '@nestjs/common';

// Extract types from HelmetOptions
type ContentSecurityPolicyOptions = Extract<HelmetOptions['contentSecurityPolicy'], object>;
type ContentSecurityPolicyDirectives = ContentSecurityPolicyOptions['directives'];

export interface NestSecurityConfig {
  helmetEnabled?: boolean;
  hstsEnabled?: boolean;
  hstsMaxAge?: number;
  corsOrigins?: string | string[];
  corsCredentials?: boolean;
  cspEnabled?: boolean;
  cspDirectives?: ContentSecurityPolicyDirectives;
}

/**
 * Configure security middleware for NestJS applications
 * Includes Helmet, CORS, and other security headers
 */
export function configureNestSecurity(
  app: INestApplication,
  config: NestSecurityConfig = {}
): void {
  const {
    helmetEnabled = true,
    hstsEnabled = true,
    hstsMaxAge = 31536000,
    corsOrigins = '*',
    corsCredentials = true,
    cspEnabled = true,
    cspDirectives,
  } = config;

  // Configure Helmet security headers
  if (helmetEnabled) {
    const helmetConfig: HelmetOptions = {
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: hstsEnabled ? {
        maxAge: hstsMaxAge,
        includeSubDomains: true,
        preload: true,
      } : false,
      contentSecurityPolicy: cspEnabled ? {
        directives: cspDirectives || {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
    };

    app.use(helmet(helmetConfig));
  }

  // Configure CORS
  const origins = corsOrigins === '*'
    ? true
    : Array.isArray(corsOrigins)
      ? corsOrigins
      : corsOrigins.split(',').map(o => o.trim());

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page',
      'X-Per-Page',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: corsCredentials,
    maxAge: 3600,
  });
}

/**
 * Default CSP directives for API services
 */
export const API_CSP_DIRECTIVES: ContentSecurityPolicyDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};

/**
 * CSP directives for services with Swagger UI
 */
export const SWAGGER_CSP_DIRECTIVES: ContentSecurityPolicyDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:', 'validator.swagger.io'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'", 'data:'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};
