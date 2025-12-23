import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsArray,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { WebhookEventType } from '../entities/webhook-subscription.entity';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Name of the webhook subscription',
    example: 'My Application Tracker',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'URL to send webhook events to',
    example: 'https://myapp.com/webhooks/applyforus',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'List of events to subscribe to',
    example: ['application.submitted', 'application.status.changed'],
    enum: WebhookEventType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events: WebhookEventType[];

  @ApiPropertyOptional({
    description: 'Secret for signing webhook payloads (HMAC-SHA256)',
    example: 'whsec_your_secret_here',
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  secret?: string;

  @ApiPropertyOptional({
    description: 'Additional headers to include in webhook requests',
    example: { 'X-Custom-Header': 'value' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts',
    default: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  max_retries?: number;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    default: 30000,
    minimum: 1000,
    maximum: 60000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  timeout_ms?: number;

  @ApiPropertyOptional({
    description: 'Whether the webhook is enabled',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({
    description: 'Name of the webhook subscription',
    example: 'My Application Tracker',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL to send webhook events to',
    example: 'https://myapp.com/webhooks/applyforus',
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({
    description: 'List of events to subscribe to',
    example: ['application.submitted', 'application.status.changed'],
    enum: WebhookEventType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[];

  @ApiPropertyOptional({
    description: 'Secret for signing webhook payloads (HMAC-SHA256)',
    example: 'whsec_your_secret_here',
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  secret?: string;

  @ApiPropertyOptional({
    description: 'Additional headers to include in webhook requests',
    example: { 'X-Custom-Header': 'value' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  max_retries?: number;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    minimum: 1000,
    maximum: 60000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  timeout_ms?: number;

  @ApiPropertyOptional({
    description: 'Whether the webhook is enabled',
  })
  @IsOptional()
  @IsBoolean()
  is_enabled?: boolean;
}

export class WebhookResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: WebhookEventType, isArray: true })
  events: WebhookEventType[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  is_enabled: boolean;

  @ApiProperty()
  failure_count: number;

  @ApiPropertyOptional()
  last_triggered_at?: Date;

  @ApiPropertyOptional()
  last_success_at?: Date;

  @ApiPropertyOptional()
  last_failure_at?: Date;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class WebhookDeliveryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subscription_id: string;

  @ApiProperty({ enum: WebhookEventType })
  event_type: WebhookEventType;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  response_status_code?: number;

  @ApiPropertyOptional()
  response_time_ms?: number;

  @ApiProperty()
  attempt_count: number;

  @ApiPropertyOptional()
  error_message?: string;

  @ApiPropertyOptional()
  delivered_at?: Date;

  @ApiProperty()
  created_at: Date;
}

export class TestWebhookDto {
  @ApiPropertyOptional({
    description: 'Event type to test',
    enum: WebhookEventType,
    default: 'application.submitted',
  })
  @IsOptional()
  @IsEnum(WebhookEventType)
  event_type?: WebhookEventType;
}
