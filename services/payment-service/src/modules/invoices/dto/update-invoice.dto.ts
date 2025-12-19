import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsUrl, IsObject } from 'class-validator';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';

export class UpdateInvoiceDto {
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
