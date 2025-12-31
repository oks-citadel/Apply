import { Logger } from '@nestjs/common';

import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize OpenTelemetry tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'auto-apply-service',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    });
    logger.log('Telemetry initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize telemetry, continuing without tracing', error);
  }

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const helmet = await import('helmet');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers with Helmet
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
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
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  }));

  // CORS configuration - secure origins only
  const corsOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
  const allowedOrigins = (corsOrigins && corsOrigins !== '*')
    ? corsOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : isProduction
      ? [
          'https://applyforus.com',
          'https://www.applyforus.com',
        ]
      : [
          'https://applyforus.com',
          'https://dev.applyforus.com',
          'http://localhost:3000', // For local development
          'http://localhost:3001',
        ];

  app.enableCors({
    origin: (origin, callback) => {
      // In production, require an origin for browser requests (blocks null origin)
      // In development, allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        if (isProduction) {
          logger.warn('CORS request with null origin blocked in production');
          return callback(new Error('Origin header required in production'));
        }
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auto-Apply Service API')
    .setDescription('Automated Job Application Service for ApplyForUs AI Platform - Handles automated job applications, application tracking, and answer libraries')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Applications', 'Job application management and tracking')
    .addTag('Auto-Apply', 'Automated application settings and controls')
    .addTag('Engine', 'Application engine for processing job applications')
    .addTag('Answer Library', 'Pre-saved answers for common application questions')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // No global prefix - ingress routes /auto-apply to this service directly
  // app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 8085;
  // Graceful shutdown handling
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Auto-Apply Service is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
