import { Logger } from '@nestjs/common';

import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize OpenTelemetry tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'resume-service',
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
  const compression = await import('compression');
  const { AppModule } = await import('./app.module');
  const { HttpExceptionFilter } = await import('./common/filters/http-exception.filter');
  const { TransformInterceptor } = await import('./common/interceptors/transform.interceptor');
  const express = await import('express');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 8083);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', true);

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

  // Compression
  app.use(compression.default());

  // No global prefix - ingress routes /resumes to this service directly
  // app.setGlobalPrefix(apiPrefix);

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins === '*' ? true : corsOrigins.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // File upload size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger documentation
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Resume Service API')
      .setDescription('Resume Management Microservice for Job Apply Platform')
      .setVersion('1.0')
      .addTag('resumes', 'Resume management endpoints')
      .addTag('sections', 'Resume section management endpoints')
      .addTag('templates', 'Resume template endpoints')
      .addTag('parser', 'Resume parsing endpoints')
      .addTag('export', 'Resume export endpoints')
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
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger documentation available at http://localhost:${port}/${apiPrefix}/docs`);
  }

  // Health check
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'resume-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Graceful shutdown handling
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Resume Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${configService.get('nodeEnv')}`);
}

bootstrap();
