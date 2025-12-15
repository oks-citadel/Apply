/**
 * Example main.ts with monitoring integration
 *
 * This file demonstrates how to integrate the telemetry package into a NestJS service.
 * Replace your existing main.ts with this example (after adjusting for your specific needs).
 */

import { initTelemetry } from '@applyforus/telemetry';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  // STEP 1: Initialize telemetry FIRST - before any other imports
  // This ensures all dependencies are properly instrumented
  await initTelemetry({
    serviceName: 'job-service',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    enableConsoleExport: process.env.NODE_ENV === 'development',
    sampleRate: parseFloat(process.env.TRACE_SAMPLE_RATE || '1.0'),
  });

  // STEP 2: Now import application modules
  const { AppModule } = await import('./app.module');
  const { StructuredLogger } = await import('@applyforus/telemetry');

  // STEP 3: Create NestJS application with custom logger
  const logger = new StructuredLogger({
    serviceName: 'job-service',
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL || 'info',
  });

  const app = await NestFactory.create(AppModule, {
    logger: false, // Disable default logger
  });

  // Use our structured logger
  app.useLogger(logger);

  // STEP 4: Configure middleware
  app.use(helmet());
  app.use(compression());

  // STEP 5: Configure global pipes
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

  // STEP 6: Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Job Service API')
    .setDescription('Job searching and management service')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('jobs')
    .addTag('search')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // STEP 7: Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // STEP 8: Start the application
  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.info('Job Service started successfully', {
    port,
    environment: process.env.NODE_ENV,
    swagger: `http://localhost:${port}/api/docs`,
    metrics: `http://localhost:${port}/metrics`,
    health: `http://localhost:${port}/health`,
  });

  // STEP 9: Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received, starting graceful shutdown');
    await app.close();
    logger.info('Application closed successfully');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received, starting graceful shutdown');
    await app.close();
    logger.info('Application closed successfully');
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Fatal error during application bootstrap:', error);
  process.exit(1);
});
