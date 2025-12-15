// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  // Initialize distributed tracing with Azure Application Insights
  await initTelemetry({
    serviceName: 'auto-apply-service',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Import NestJS modules AFTER telemetry initialization
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe, Logger } = await import('@nestjs/common');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule);

  // Enable CORS with secure defaults
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
