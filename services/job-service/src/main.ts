import { initTelemetry } from '@applyforus/telemetry';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize OpenTelemetry tracing with Azure Application Insights
  try {
    await initTelemetry({
      serviceName: 'job-service',
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
  const { ConfigService } = await import('@nestjs/config');
  const { AppModule } = await import('./app.module');

  // Use require for CommonJS modules
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const helmet = require('helmet');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compression = require('compression');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8084);
  // Remove global prefix - ingress routes /jobs to this service directly
  const apiPrefix = configService.get<string>('API_PREFIX', '');

  // Security middleware
  app.use(helmet());

  // Compression middleware
  app.use(compression());

  // CORS configuration - secure origins only
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map(o => o.trim())
    : [
        'https://applyforus.com',
        'https://dev.applyforus.com',
        'http://localhost:3000', // For local development
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix - only set if not empty
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Job Service API')
    .setDescription('Job Service API for Job-Apply-Platform - Manages job listings, search, alerts, and aggregation from multiple job boards')
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
    .addTag('Jobs', 'Job listing and search endpoints')
    .addTag('Companies', 'Company information endpoints')
    .addTag('Alerts', 'Job alert management endpoints')
    .addTag('Search', 'Advanced search endpoints')
    .addTag('Job Aggregation', 'Aggregate jobs from 10+ job boards (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Dice, etc.)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const docsPath = apiPrefix ? `${apiPrefix}/docs` : 'docs';
  SwaggerModule.setup(docsPath, app, document, {
    customSiteTitle: 'Job Service API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(port);

  logger.log('=====================================================');
  logger.log('Job Service is running!');
  logger.log(`API: http://localhost:${port}/jobs`);
  logger.log(`Swagger Docs: http://localhost:${port}/${docsPath}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log('=====================================================');
}

bootstrap();
