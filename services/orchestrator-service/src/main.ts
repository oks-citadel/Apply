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
        connectSrc: ["'self'"],
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

  // CORS configuration - secure origins only
  const corsOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINS || '';
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0)
    : isProduction
      ? [
          'https://applyforus.com',
          'https://www.applyforus.com',
        ]
      : [
          'https://applyforus.com',
          'https://dev.applyforus.com',
          'http://localhost:3000', // For local development
        ];

  app.enableCors({
    origin: (origin, callback) => {
      // In production, require an origin for browser requests (blocks null origin)
      // In development, allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) {
        if (isProduction) {
          logger.warn('CORS request with null origin blocked in production');
          return callback(new Error('Origin header required in production'));
        }
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
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
