import { Logger } from '@nestjs/common';
import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize OpenTelemetry tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'auth-service',
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
  const { ConfigService } = await import('@nestjs/config');
  const helmet = await import('helmet');
  const { AppModule } = await import('./app.module');
  const { HttpExceptionFilter } = await import('./common/filters/http-exception.filter');
  const { LoggingInterceptor } = await import('./common/interceptors/logging.interceptor');
  const { TransformInterceptor } = await import('./common/interceptors/transform.interceptor');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security headers with Helmet
  if (configService.get<boolean>('security.helmetEnabled', true)) {
    const hstsEnabled = configService.get<boolean>('security.hstsEnabled', true);
    const hstsMaxAge = configService.get<number>('security.hstsMaxAge', 31536000);

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
      hsts: hstsEnabled ? {
        maxAge: hstsMaxAge,
        includeSubDomains: true,
        preload: true,
      } : false,
    }));
  }

  // No global prefix - ingress routes /auth to this service directly
  // app.setGlobalPrefix('api/v1');

  // CORS configuration - secure origins only
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map(o => o.trim())
    : [
        'https://applyforus.com',
        'https://dev.applyforus.com',
        'http://localhost:3000', // For local development
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 3600,
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
      // Always enable detailed error messages for better debugging
      disableErrorMessages: false,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation setup
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ApplyForUs Auth Service API')
      .setDescription('Authentication and Authorization Service for ApplyForUs AI Platform')
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
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addServer(`http://localhost:${configService.get('PORT', 3001)}`, 'Local server')
      .addServer(configService.get('API_BASE_URL', 'http://localhost:3001'), 'API server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger documentation available at: http://localhost:${configService.get('PORT', 3001)}/docs`);
  }

  // Graceful shutdown handling
  app.enableShutdownHooks();

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  logger.log(`Auth Service is running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
