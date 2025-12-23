import { Logger } from '@nestjs/common';

import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize OpenTelemetry tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'orchestrator-service',
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
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

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

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('ApplyForUs Orchestrator Service')
    .setDescription('Master Orchestrator Agent for ApplyForUs AI multi-agent system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('orchestration', 'Task orchestration and workflow management')
    .addTag('agents', 'Agent health and status monitoring')
    .addTag('workflows', 'Workflow execution endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8089;
  // Graceful shutdown handling
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Orchestrator Service running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
