import { Logger } from '@nestjs/common';
import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize distributed tracing with Azure Application Insights
  await initTelemetry({
    serviceName: 'user-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { ConfigService } = await import('@nestjs/config');
  const helmet = await import('helmet');
  const compression = await import('compression');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers with Helmet
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // Compression
  const compressionMiddleware = compression.default || compression;
  app.use(compressionMiddleware());

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Validation
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

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User Profile and Preference Management Microservice')
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
    .addTag('Profile', 'User profile management')
    .addTag('Career', 'Work experience and education')
    .addTag('Skills', 'Skills management')
    .addTag('Preferences', 'Job preferences')
    .addTag('Subscription', 'Subscription and billing')
    .addTag('Analytics', 'User analytics and dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 8002);
  await app.listen(port);

  logger.log(`User Service is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
