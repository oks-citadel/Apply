import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUrl,
  IsObject,
  IsUUID,
} from 'class-validator';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    description: 'Stripe invoice ID',
    example: 'in_1234567890',
  })
  @IsString()
  stripeInvoiceId: string;

  @ApiProperty({
    description: 'Stripe customer ID',
    example: 'cus_1234567890',
  })
  @IsString()
  stripeCustomerId: string;

  @ApiProperty({
    description: 'Invoice amount',
    example: 29.99,
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'usd',
    default: 'usd',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Invoice status',
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID,
  })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Date when invoice was paid',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  paidAt?: Date;

  @ApiPropertyOptional({
    description: 'Invoice URL',
    example: 'https://invoice.stripe.com/i/acct_xxx/invst_xxx',
  })
  @IsUrl()
  @IsOptional()
  invoiceUrl?: string;

  @ApiPropertyOptional({
    description: 'Invoice PDF URL',
    example: 'https://pay.stripe.com/invoice/acct_xxx/invst_xxx/pdf',
  })
  @IsUrl()
  @IsOptional()
  invoicePdfUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { billingPeriod: 'monthly' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
