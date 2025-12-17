import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(8003),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('resume_service'),
  DB_SSL: Joi.string().default('false'),

  // JWT
  JWT_SECRET: Joi.string().default('change-this-secret-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB in bytes
  UPLOAD_DEST: Joi.string().default('./uploads'),

  // Services URLs
  AUTH_SERVICE_URL: Joi.string().default('http://localhost:8001'),
  USER_SERVICE_URL: Joi.string().default('http://localhost:8002'),
  AI_SERVICE_URL: Joi.string().default('http://localhost:8004'),

  // Redis (for caching)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),

  // API
  API_PREFIX: Joi.string().default('api/v1'),
  SWAGGER_ENABLED: Joi.boolean().default(true),
});

export const appConfig = () => ({
  port: parseInt(process.env.PORT || '8003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'resume_service',
    ssl: process.env.DB_SSL === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    destination: process.env.UPLOAD_DEST || './uploads',
  },

  services: {
    authService: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    userService: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    aiService: process.env.AI_SERVICE_URL || 'http://localhost:8004',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
  },
});
