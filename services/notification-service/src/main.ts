// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@applyforus/telemetry';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize distributed tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'notification-service',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      azureMonitorConnectionString:
        process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    });
    logger.log('Telemetry initialized successfully');
  } catch (error) {
    logger.warn(
      'Failed to initialize telemetry, continuing without tracing',
      error,
    );
  }

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const helmet = await import('helmet');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers with Helmet
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'], // Allow WebSocket connections
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  }));

  // Enable CORS for HTTP and WebSocket
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    .addTag('push')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown handling
  app.enableShutdownHooks();

  const port = process.env.PORT || 8087;
  await app.listen(port);

  logger.log(`Notification Service is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
  logger.log(`WebSocket server ready at: ws://localhost:${port}/notifications`);
}
bootstrap();
