// TODO: Re-enable workspace package
// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
// import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // TODO: Re-enable workspace package
  // Initialize distributed tracing with Azure Application Insights
  // await initTelemetry({
  //   serviceName: 'auto-apply-service',
  //   serviceVersion: '1.0.0',
  //   environment: process.env.NODE_ENV || 'development',
  //   azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  // });

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe, Logger } = await import('@nestjs/common');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
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

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 8005;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Auto-Apply Service is running on: http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
