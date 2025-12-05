import { Logger } from '@nestjs/common';

// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize distributed tracing with Azure Application Insights
  await initTelemetry({
    serviceName: 'analytics-service',
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
  const { LoggingInterceptor } = await import('./common/interceptors/logging.interceptor');
  const { TransformInterceptor } = await import('./common/interceptors/transform.interceptor');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('corsOrigins', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
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
      disableErrorMessages: configService.get('nodeEnv') === 'production',
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation setup
  if (configService.get('nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('JobPilot Analytics Service API')
      .setDescription('Analytics and Metrics Service for JobPilot AI Platform')
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
      .addTag('analytics', 'Analytics endpoints')
      .addServer(`http://localhost:${configService.get('port', 8006)}`, 'Local server')
      .addServer(configService.get('apiBaseUrl', 'http://localhost:8006'), 'API server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger documentation available at: http://localhost:${configService.get('port', 8006)}/api/docs`);
  }

  // Graceful shutdown handling
  app.enableShutdownHooks();

  const port = configService.get('port', 8006);
  await app.listen(port);

  logger.log(`Analytics Service is running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get('nodeEnv', 'development')}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
