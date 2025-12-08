# Swagger/OpenAPI Implementation Guide

This guide provides comprehensive instructions for implementing Swagger/OpenAPI documentation across all NestJS services in the JobPilot AI Platform.

## Table of Contents

1. [Setup](#setup)
2. [Controller Documentation](#controller-documentation)
3. [DTO Documentation](#dto-documentation)
4. [Response Schemas](#response-schemas)
5. [Authentication Documentation](#authentication-documentation)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

## Setup

### 1. Install Dependencies

```bash
npm install @nestjs/swagger swagger-ui-express
```

### 2. Configure in main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Service Name API')
    .setDescription('Detailed API documentation for Service Name')
    .setVersion('1.0.0')
    .addTag('tag-name', 'Tag description')
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
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.jobpilot.ai', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Service Name API Documentation',
  });

  await app.listen(3001);
  console.log(`Swagger docs available at: http://localhost:3001/docs`);
}
bootstrap();
```

## Controller Documentation

### Required Decorators

Every controller and endpoint should have comprehensive Swagger decorators.

#### Controller-Level Decorators

```typescript
import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Resource Name')  // Groups endpoints in Swagger UI
@ApiBearerAuth('JWT-auth')  // Applies JWT auth to all endpoints
@Controller('resource')
export class ResourceController {
  // Endpoints
}
```

#### Endpoint-Level Decorators

```typescript
import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({
  summary: 'Create a new resource',
  description: 'Detailed description of what this endpoint does, any business logic, and important notes',
})
@ApiBody({
  type: CreateResourceDto,
  description: 'Resource creation payload',
  examples: {
    basic: {
      summary: 'Basic example',
      description: 'A basic resource creation example',
      value: {
        name: 'Resource Name',
        description: 'Resource Description',
      },
    },
    advanced: {
      summary: 'Advanced example',
      description: 'An advanced resource with all optional fields',
      value: {
        name: 'Advanced Resource',
        description: 'Detailed description',
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value' },
      },
    },
  },
})
@ApiResponse({
  status: 201,
  description: 'Resource created successfully',
  type: ResourceResponseDto,
})
@ApiResponse({
  status: 400,
  description: 'Bad Request - Invalid input data',
  schema: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'VALIDATION_ERROR' },
      message: { type: 'string', example: 'Validation failed' },
      details: { type: 'object' },
    },
  },
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing authentication token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions',
})
@ApiResponse({
  status: 500,
  description: 'Internal Server Error',
})
async create(@Body() createDto: CreateResourceDto): Promise<ResourceResponseDto> {
  return this.service.create(createDto);
}
```

### Path Parameters

```typescript
@Get(':id')
@ApiOperation({ summary: 'Get resource by ID' })
@ApiParam({
  name: 'id',
  description: 'Unique resource identifier',
  type: String,
  format: 'uuid',
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@ApiResponse({ status: 200, type: ResourceResponseDto })
@ApiResponse({ status: 404, description: 'Resource not found' })
async findOne(@Param('id') id: string): Promise<ResourceResponseDto> {
  return this.service.findOne(id);
}
```

### Query Parameters

```typescript
@Get()
@ApiOperation({ summary: 'List all resources with pagination' })
@ApiQuery({
  name: 'page',
  required: false,
  type: Number,
  description: 'Page number (default: 1)',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  type: Number,
  description: 'Items per page (default: 20, max: 100)',
  example: 20,
})
@ApiQuery({
  name: 'search',
  required: false,
  type: String,
  description: 'Search query (partial match)',
  example: 'search term',
})
@ApiQuery({
  name: 'status',
  required: false,
  enum: ['active', 'inactive', 'pending'],
  description: 'Filter by status',
  example: 'active',
})
@ApiResponse({ status: 200, type: [ResourceResponseDto] })
async findAll(
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @Query('search') search?: string,
  @Query('status') status?: string,
): Promise<ResourceResponseDto[]> {
  return this.service.findAll({ page, limit, search, status });
}
```

## DTO Documentation

### Request DTOs

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MinLength,
  MaxLength,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export class CreateResourceDto {
  @ApiProperty({
    description: 'Resource name',
    example: 'My Resource',
    minLength: 3,
    maxLength: 100,
    required: true,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Resource description',
    example: 'Detailed description of the resource',
    maxLength: 500,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiPropertyOptional({
    description: 'Resource status',
    enum: ResourceStatus,
    enumName: 'ResourceStatus',
    default: ResourceStatus.PENDING,
    example: ResourceStatus.ACTIVE,
  })
  @IsEnum(ResourceStatus, { message: 'Status must be one of: active, inactive, pending' })
  @IsOptional()
  status?: ResourceStatus;

  @ApiPropertyOptional({
    description: 'Resource tags for categorization',
    type: [String],
    example: ['tag1', 'tag2', 'tag3'],
    maxItems: 10,
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Priority level (1-10)',
    minimum: 1,
    maximum: 10,
    example: 5,
    type: Number,
  })
  @IsNumber({}, { message: 'Priority must be a number' })
  @Min(1, { message: 'Priority must be at least 1' })
  @Max(10, { message: 'Priority must not exceed 10' })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata as key-value pairs',
    type: 'object',
    example: {
      key1: 'value1',
      key2: 'value2',
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
```

### Response DTOs

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class ResourceResponseDto {
  @ApiProperty({
    description: 'Unique resource identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Resource name',
    example: 'My Resource',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Resource description',
    example: 'Detailed description',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Resource status',
    enum: ResourceStatus,
    example: ResourceStatus.ACTIVE,
  })
  @Expose()
  status: ResourceStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T15:45:00.000Z',
    format: 'date-time',
  })
  @Expose()
  updatedAt: Date;

  // Exclude sensitive fields from response
  @Exclude()
  password: string;

  @Exclude()
  deletedAt?: Date;
}

// Paginated response wrapper
export class PaginatedResourceResponseDto {
  @ApiProperty({
    description: 'Array of resources',
    type: [ResourceResponseDto],
  })
  data: ResourceResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    example: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Response Schemas

### Success Responses

```typescript
// Simple success
@ApiResponse({
  status: 200,
  description: 'Operation successful',
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Operation completed successfully' },
    },
  },
})

// Array response
@ApiResponse({
  status: 200,
  description: 'List of resources',
  type: [ResourceResponseDto],
})

// Paginated response
@ApiResponse({
  status: 200,
  description: 'Paginated list of resources',
  type: PaginatedResourceResponseDto,
})
```

### Error Responses

```typescript
// Standard error responses to include in every endpoint
@ApiResponse({
  status: 400,
  description: 'Bad Request - Invalid input data',
  schema: {
    type: 'object',
    properties: {
      error: { type: 'string', example: 'VALIDATION_ERROR' },
      message: { type: 'string', example: 'Validation failed' },
      statusCode: { type: 'number', example: 400 },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string', example: '/api/resource' },
      details: {
        type: 'object',
        example: {
          field: 'email',
          constraint: 'must be a valid email',
        },
      },
    },
  },
})

@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing authentication token',
})

@ApiResponse({
  status: 403,
  description: 'Forbidden - Insufficient permissions to access resource',
})

@ApiResponse({
  status: 404,
  description: 'Not Found - Resource does not exist',
})

@ApiResponse({
  status: 409,
  description: 'Conflict - Resource already exists',
})

@ApiResponse({
  status: 429,
  description: 'Too Many Requests - Rate limit exceeded',
})

@ApiResponse({
  status: 500,
  description: 'Internal Server Error - Unexpected server error occurred',
})
```

## Authentication Documentation

### JWT Bearer Authentication

```typescript
// In main.ts
config.addBearerAuth(
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'JWT',
    description: 'Enter JWT token',
    in: 'header',
  },
  'JWT-auth',
);

// In controller
@ApiBearerAuth('JWT-auth')
@Controller('resource')
export class ResourceController {}
```

### API Key Authentication

```typescript
// In main.ts
config.addApiKey(
  {
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
  },
  'api-key',
);

// In controller
@ApiSecurity('api-key')
@Controller('resource')
export class ResourceController {}
```

## Best Practices

### 1. Consistent Naming

- Use descriptive, action-oriented summary texts
- Keep descriptions detailed but concise
- Use consistent terminology across all services

### 2. Comprehensive Examples

Always provide:
- Basic example (minimal required fields)
- Advanced example (with optional fields)
- Edge cases when relevant

### 3. Response Types

- Always specify response types
- Use DTOs for structured responses
- Document all possible status codes

### 4. Validation Messages

Make validation messages user-friendly:

```typescript
@IsString({ message: 'Name must be a string' })
@IsNotEmpty({ message: 'Name is required' })
@MinLength(3, { message: 'Name must be at least 3 characters long' })
name: string;
```

### 5. Enum Documentation

Always document enums with:
- Full enum definition
- Example values
- Clear descriptions

```typescript
export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@ApiProperty({
  enum: ResourceStatus,
  enumName: 'ResourceStatus',
  description: 'Current status of the resource',
  example: ResourceStatus.ACTIVE,
})
status: ResourceStatus;
```

### 6. Nested Objects

For nested objects, create separate DTOs:

```typescript
export class AddressDto {
  @ApiProperty({ example: '123 Main St' })
  street: string;

  @ApiProperty({ example: 'San Francisco' })
  city: string;

  @ApiProperty({ example: 'CA' })
  state: string;
}

export class UserDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ type: AddressDto })
  address: AddressDto;
}
```

### 7. File Uploads

```typescript
@Post('upload')
@ApiOperation({ summary: 'Upload file' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
      description: {
        type: 'string',
      },
    },
  },
})
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body('description') description: string,
) {
  // Implementation
}
```

## Examples

### Complete Controller Example

See the enhanced controller files in:
- `/services/auto-apply-service/src/modules/applications/applications.controller.ENHANCED.ts`

### Complete DTO Examples

See the enhanced DTO files in:
- `/services/auto-apply-service/src/modules/applications/dto/*.ENHANCED.ts`

## Testing Swagger Documentation

1. **Start the service**:
   ```bash
   npm run start:dev
   ```

2. **Access Swagger UI**:
   ```
   http://localhost:3001/docs
   ```

3. **Test each endpoint**:
   - Click on an endpoint
   - Click "Try it out"
   - Fill in parameters
   - Execute request
   - Verify response

4. **Export OpenAPI Spec**:
   ```
   http://localhost:3001/docs-json
   ```

## Checklist

Before considering Swagger documentation complete, verify:

- [ ] All controllers have `@ApiTags()`
- [ ] All endpoints have `@ApiOperation()`
- [ ] All endpoints have appropriate `@ApiResponse()` for each status code
- [ ] All DTOs have `@ApiProperty()` or `@ApiPropertyOptional()`
- [ ] All path parameters have `@ApiParam()`
- [ ] All query parameters have `@ApiQuery()`
- [ ] All request bodies have `@ApiBody()`
- [ ] Examples are provided for complex DTOs
- [ ] Enums are properly documented with `enumName`
- [ ] Authentication is documented with `@ApiBearerAuth()`
- [ ] Validation messages are user-friendly
- [ ] Error responses are comprehensive
- [ ] Swagger UI renders correctly
- [ ] All endpoints are testable via Swagger UI

## Tools

### Generate OpenAPI Spec

```bash
npm run build
npm run start:prod
curl http://localhost:3001/docs-json > openapi.json
```

### Validate OpenAPI Spec

```bash
npx @redocly/cli lint openapi.json
```

### Generate API Client

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-axios \
  -o ./generated-client
```

## Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [class-validator Decorators](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)

## Support

For questions or issues with Swagger implementation:
1. Check this guide first
2. Review example implementations in the codebase
3. Consult NestJS documentation
4. Contact the platform team
