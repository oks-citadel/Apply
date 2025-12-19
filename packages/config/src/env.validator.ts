import Joi from 'joi';

export interface EnvSchema {
  [key: string]: Joi.Schema;
}

/**
 * Validate environment variables against a Joi schema
 */
export function validateEnv<T extends Record<string, unknown>>(
  schema: EnvSchema,
  env: NodeJS.ProcessEnv = process.env
): T {
  const joiSchema = Joi.object(schema).unknown();

  const { error, value } = joiSchema.validate(env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return value as T;
}

/**
 * Common validation schemas for environment variables
 */
export const commonSchemas = {
  // Server configuration
  port: Joi.number().port().default(3000),
  host: Joi.string().hostname().default('0.0.0.0'),
  nodeEnv: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  // Database configuration
  databaseUrl: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }),
  databaseHost: Joi.string().hostname(),
  databasePort: Joi.number().port().default(5432),
  databaseName: Joi.string(),
  databaseUser: Joi.string(),
  databasePassword: Joi.string(),

  // Redis configuration
  redisUrl: Joi.string().uri({ scheme: ['redis', 'rediss'] }),
  redisHost: Joi.string().hostname(),
  redisPort: Joi.number().port().default(6379),
  redisPassword: Joi.string().allow(''),

  // JWT configuration
  jwtSecret: Joi.string().min(32),
  jwtExpiresIn: Joi.string().default('1h'),
  jwtRefreshExpiresIn: Joi.string().default('7d'),

  // API configuration
  apiPrefix: Joi.string().default('/api'),
  corsOrigin: Joi.string(),

  // Feature flags
  featureFlag: Joi.boolean().default(false),

  // Optional string
  optionalString: Joi.string().allow('').optional(),

  // Required string
  requiredString: Joi.string().required(),
};
