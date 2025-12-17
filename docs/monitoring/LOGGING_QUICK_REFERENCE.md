# Logging Quick Reference Guide

Quick reference for using the proper logging system in Job-Apply-Platform.

## For NestJS Services

### Import
```typescript
import { Logger } from '@nestjs/common';
```

### In Services/Controllers
```typescript
@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async myMethod() {
    // Info/debug logging
    this.logger.log('Operation started');
    this.logger.debug('Debug details', { userId: '123' });
    this.logger.verbose('Verbose information');

    // Warning logging
    this.logger.warn('Potential issue detected', { context: 'data' });

    // Error logging
    try {
      // ... code
    } catch (error) {
      this.logger.error('Operation failed', error.stack);
      // or with context
      this.logger.error(`Operation failed for user ${userId}`, error.stack);
    }
  }
}
```

### In Bootstrap/Scripts
```typescript
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Application starting...');
  logger.log(`Environment: ${process.env.NODE_ENV}`);

  try {
    // ... initialization
  } catch (error) {
    logger.error('Initialization failed', error);
  }
}
```

## For Next.js Web App

### Import
```typescript
import { logger } from '@/lib/logger';
```

### In Components/Hooks
```typescript
function MyComponent() {
  const handleAction = async () => {
    try {
      logger.info('User action started', { action: 'submit', userId: '123' });

      // ... code

      logger.info('User action completed', { action: 'submit', userId: '123' });
    } catch (error) {
      logger.error('User action failed', error as Error, {
        action: 'submit',
        userId: '123'
      });
    }
  };
}
```

### Warning Messages
```typescript
logger.warn('Deprecated feature used', {
  feature: 'oldFeature',
  userId: '123',
  replacement: 'newFeature'
});
```

### Debug Logging (Development Only)
```typescript
logger.debug('Detailed debug info', {
  state: currentState,
  props: componentProps,
  userId: '123'
});
```

### With Child Logger (for context)
```typescript
import { createLogger } from '@/lib/logger';

function MyComponent({ userId }: Props) {
  const logger = createLogger({ component: 'MyComponent', userId });

  // All logs will automatically include component and userId
  logger.info('Action performed');
  logger.error('Action failed', error);
}
```

## Log Levels

### When to Use Each Level

| Level | NestJS Method | Web Logger Method | Use Case |
|-------|--------------|-------------------|----------|
| **Debug** | `logger.debug()` | `logger.debug()` | Detailed diagnostic information. Only shown in development. |
| **Info** | `logger.log()` | `logger.info()` | General informational messages about application flow. |
| **Verbose** | `logger.verbose()` | N/A | Very detailed information, more than debug. |
| **Warning** | `logger.warn()` | `logger.warn()` | Potentially harmful situations that should be reviewed. |
| **Error** | `logger.error()` | `logger.error()` | Error events that might still allow the application to continue. |

## Common Patterns

### API Request Logging
```typescript
// NestJS Controller
@Get()
async findAll() {
  this.logger.log('Fetching all items');

  try {
    const items = await this.service.findAll();
    this.logger.log(`Found ${items.length} items`);
    return items;
  } catch (error) {
    this.logger.error('Failed to fetch items', error.stack);
    throw error;
  }
}
```

### Database Operation Logging
```typescript
// Service
async create(dto: CreateDto) {
  this.logger.debug('Creating new entity', { dto });

  try {
    const entity = await this.repository.save(dto);
    this.logger.log(`Created entity with id: ${entity.id}`);
    return entity;
  } catch (error) {
    this.logger.error('Failed to create entity', error.stack);
    throw error;
  }
}
```

### External API Call Logging
```typescript
// Web App
async function fetchData() {
  logger.info('Calling external API', { endpoint: '/api/data' });

  try {
    const response = await fetch('/api/data');
    logger.info('External API call successful', {
      endpoint: '/api/data',
      status: response.status
    });
    return response.json();
  } catch (error) {
    logger.error('External API call failed', error as Error, {
      endpoint: '/api/data'
    });
    throw error;
  }
}
```

### User Action Logging
```typescript
// Web App
const handleSubmit = async (formData: FormData) => {
  logger.info('Form submission started', {
    form: 'contactForm',
    userId: currentUser.id
  });

  try {
    await submitForm(formData);
    logger.info('Form submission successful', {
      form: 'contactForm',
      userId: currentUser.id
    });
  } catch (error) {
    logger.error('Form submission failed', error as Error, {
      form: 'contactForm',
      userId: currentUser.id,
      formData: sanitizeFormData(formData)
    });
  }
};
```

## Best Practices

### ✅ DO
- Use appropriate log levels
- Include context (userId, requestId, entityId, etc.)
- Log both success and failure paths
- Use structured logging (pass objects, not concatenated strings)
- Log at boundaries (API calls, database operations, external services)
- Include stack traces for errors

### ❌ DON'T
- Log sensitive information (passwords, tokens, PII)
- Use console.log, console.error, console.warn directly
- Log in tight loops (consider sampling or aggregating)
- Include full objects that might be large (sanitize first)
- Ignore errors silently

## Examples: Before and After

### Before (❌)
```typescript
console.log('User logged in');
console.error('Error:', error);
```

### After (✅)
```typescript
// NestJS
this.logger.log('User logged in', { userId: user.id });
this.logger.error('Login failed', error.stack, { username: user.username });

// Web App
logger.info('User logged in', { userId: user.id });
logger.error('Login failed', error, { username: user.username });
```

### Before (❌)
```typescript
try {
  await processData(data);
  console.log('Processed data');
} catch (err) {
  console.error(err);
}
```

### After (✅)
```typescript
// NestJS
try {
  await this.processData(data);
  this.logger.log('Data processed successfully', { dataId: data.id });
} catch (error) {
  this.logger.error('Data processing failed', error.stack, { dataId: data.id });
  throw error;
}

// Web App
try {
  await processData(data);
  logger.info('Data processed successfully', { dataId: data.id });
} catch (error) {
  logger.error('Data processing failed', error as Error, { dataId: data.id });
  throw error;
}
```

## Configuration

### NestJS Logger Levels
Set in `main.ts`:
```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'], // All levels
  // or for production:
  logger: ['error', 'warn', 'log'], // Only important levels
});
```

### Web App Logger
Automatically adjusts based on `NODE_ENV`:
- **Development**: Shows all log levels including debug
- **Production**: Only shows warn and error to console, sends all to monitoring

## Integration with Monitoring

### Application Insights (Future)
```typescript
// The logger is already structured to support this
// Just need to configure the monitoring service

// In web app logger.ts, update sendToMonitoring():
if (!this.isDevelopment && this.isClient) {
  window.appInsights?.trackTrace({
    message,
    severityLevel: this.mapLogLevel(level),
    properties: context
  });
}
```

### Sentry (Future)
```typescript
// Similar integration point
Sentry.captureMessage(message, {
  level: level,
  extra: context
});
```

## Troubleshooting

### Logger not working?
1. Check import statement is correct
2. For NestJS: Ensure Logger is from `@nestjs/common`
3. For Web App: Ensure importing from `@/lib/logger`
4. Check environment variables
5. Verify NODE_ENV is set correctly

### Logs not appearing in production?
1. Check log level configuration
2. Verify monitoring service is configured
3. Check browser console settings
4. Verify logger is initialized before use

## Additional Resources

- [NestJS Logger Documentation](https://docs.nestjs.com/techniques/logger)
- [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- Application Insights Integration (Coming Soon)
- Sentry Integration (Coming Soon)
