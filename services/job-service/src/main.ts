// Initialize telemetry BEFORE importing other modules for proper auto-instrumentation
// import { initTelemetry } from '@jobpilot/telemetry';

async function bootstrap() {
  // Initialize distributed tracing with Azure Application Insights
  // await initTelemetry({
  //   serviceName: 'job-service',
  //   serviceVersion: '1.0.0',
  //   environment: process.env.NODE_ENV || 'development',
  //   azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  // });

  // Import NestJS modules
  const { NestFactory } = await import('@nestjs/core');
  const { ValidationPipe } = await import('@nestjs/common');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { ConfigService } = await import('@nestjs/config');
  const compression = await import('compression');
  const helmet = await import('helmet');
  const { AppModule } = await import('./app.module');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8004);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Security middleware
  app.use(helmet.default());

  // Compression middleware
  app.use(compression.default());

  // CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
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

  console.log(`
    =====================================================
    🚀 Job Service is running!
    📝 API: http://localhost:${port}/${apiPrefix}
    📚 Swagger Docs: http://localhost:${port}/${apiPrefix}/docs
    🌍 Environment: ${configService.get('NODE_ENV', 'development')}
    =====================================================
  `);
}

bootstrap();
