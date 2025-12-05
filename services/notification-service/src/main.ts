// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize distributed tracing with Azure Application Insights
  await initTelemetry({
    serviceName: 'notification-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Notification and Email Service for Job Apply Platform')
    .setVersion('1.0')
    .addTag('notifications')
    .addTag('email')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 8007;
  await app.listen(port);
  console.log(`Notification Service is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
