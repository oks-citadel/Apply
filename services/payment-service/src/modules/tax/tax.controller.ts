import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaxService, CustomerTaxInfo, TaxCalculation, TaxRate } from './tax.service';

/**
 * DTO for tax calculation request
 */
export class CalculateTaxDto {
  subtotal: number;
  currency: string;
  countryCode: string;
  region?: string;
  taxId?: string;
  isBusinessCustomer: boolean;
  businessName?: string;
}

/**
 * DTO for VAT validation request
 */
export class ValidateVatDto {
  vatNumber: string;
  countryCode: string;
}

@ApiTags('Tax')
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate tax for a transaction' })
  @ApiResponse({ status: 200, description: 'Tax calculation result' })
  async calculateTax(@Body() dto: CalculateTaxDto): Promise<TaxCalculation> {
    const customerInfo: CustomerTaxInfo = {
      countryCode: dto.countryCode,
      region: dto.region,
      taxId: dto.taxId,
      isBusinessCustomer: dto.isBusinessCustomer,
      businessName: dto.businessName,
    };

    return this.taxService.calculateTax(dto.subtotal, dto.currency, customerInfo);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get all tax rates' })
  @ApiResponse({ status: 200, description: 'List of all tax rates' })
  getAllTaxRates(): TaxRate[] {
    return this.taxService.getAllTaxRates();
  }

  @Get('rates/:countryCode')
  @ApiOperation({ summary: 'Get tax rate for a specific country' })
  @ApiResponse({ status: 200, description: 'Tax rate for the country' })
  getTaxRate(@Param('countryCode') countryCode: string): TaxRate | undefined {
    return this.taxService.getTaxRate(countryCode);
  }

  @Post('validate-vat')
  @ApiOperation({ summary: 'Validate a VAT number' })
  @ApiResponse({ status: 200, description: 'VAT validation result' })
  async validateVat(@Body() dto: ValidateVatDto): Promise<{ valid: boolean; vatNumber: string; countryCode: string }> {
    const valid = await this.taxService.validateVatNumber(dto.vatNumber, dto.countryCode);
    return {
      valid,
      vatNumber: dto.vatNumber,
      countryCode: dto.countryCode,
    };
  }

  @Get('registration-required/:countryCode')
  @ApiOperation({ summary: 'Check if tax registration is required for a country' })
  @ApiResponse({ status: 200, description: 'Registration requirement' })
  isRegistrationRequired(@Param('countryCode') countryCode: string): { required: boolean; countryCode: string } {
    return {
      required: this.taxService.isRegistrationRequired(countryCode),
      countryCode,
    };
  }
}
