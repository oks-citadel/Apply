import { Logger } from '@nestjs/common';

// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize distributed tracing with Azure Application Insights
  await initTelemetry({
    serviceName: 'resume-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { ConfigService } = await import('@nestjs/config');
  const { AppModule } = await import('./app.module');
  const { HttpExceptionFilter } = await import('./common/filters/http-exception.filter');
  const { TransformInterceptor } = await import('./common/interceptors/transform.interceptor');
  const express = await import('express');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 8003);
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  const swaggerEnabled = configService.get<boolean>('swagger.enabled', true);

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

  await app.listen(port);

  logger.log(`Resume Service is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${configService.get('nodeEnv')}`);
}

bootstrap();
