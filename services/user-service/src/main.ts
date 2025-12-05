import { Logger } from '@nestjs/common';

// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@jobpilot/telemetry';

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

  // Security
  app.use(helmet.default());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Compression
  app.use(compression.default());

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
