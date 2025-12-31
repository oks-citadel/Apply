import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CurrencyService, CurrencyConfig, ConvertedAmount } from './currency.service';

/**
 * DTO for currency conversion
 */
export class ConvertCurrencyDto {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all supported currencies' })
  @ApiResponse({ status: 200, description: 'List of supported currencies' })
  getSupportedCurrencies(): CurrencyConfig[] {
    return this.currencyService.getSupportedCurrencies();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get currency details by code' })
  @ApiResponse({ status: 200, description: 'Currency details' })
  getCurrency(@Param('code') code: string): CurrencyConfig | undefined {
    return this.currencyService.getCurrency(code);
  }

  @Get('provider/:provider')
  @ApiOperation({ summary: 'Get currencies supported by a payment provider' })
  @ApiResponse({ status: 200, description: 'List of currencies' })
  getCurrenciesByProvider(
    @Param('provider') provider: 'stripe' | 'flutterwave' | 'paystack',
  ): CurrencyConfig[] {
    return this.currencyService.getCurrenciesByProvider(provider);
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiResponse({ status: 200, description: 'Converted amount' })
  async convert(@Body() dto: ConvertCurrencyDto): Promise<ConvertedAmount> {
    return this.currencyService.convert(dto.amount, dto.fromCurrency, dto.toCurrency);
  }

  @Get('rate/:from/:to')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiResponse({ status: 200, description: 'Exchange rate' })
  getExchangeRate(
    @Param('from') from: string,
    @Param('to') to: string,
  ): { from: string; to: string; rate: number } {
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: this.currencyService.getExchangeRate(from, to),
    };
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get all exchange rates (USD base)' })
  @ApiResponse({ status: 200, description: 'All exchange rates' })
  getAllExchangeRates(): Record<string, number> {
    return this.currencyService.getAllExchangeRates();
  }

  @Get('format/:amount/:currency')
  @ApiOperation({ summary: 'Format amount in currency' })
  @ApiQuery({ name: 'locale', required: false })
  @ApiResponse({ status: 200, description: 'Formatted amount' })
  formatAmount(
    @Param('amount') amount: string,
    @Param('currency') currency: string,
    @Query('locale') locale?: string,
  ): { formatted: string } {
    return {
      formatted: this.currencyService.formatAmount(parseFloat(amount), currency, locale),
    };
  }

  @Get('country/:countryCode')
  @ApiOperation({ summary: 'Get currency for a country' })
  @ApiResponse({ status: 200, description: 'Currency code' })
  getCurrencyByCountry(@Param('countryCode') countryCode: string): { countryCode: string; currencyCode: string } {
    return {
      countryCode: countryCode.toUpperCase(),
      currencyCode: this.currencyService.getCurrencyByCountry(countryCode),
    };
  }

  @Get('best-provider/:currency')
  @ApiOperation({ summary: 'Get best payment provider for a currency' })
  @ApiResponse({ status: 200, description: 'Best provider' })
  getBestProvider(@Param('currency') currency: string): { currency: string; provider: string | null } {
    return {
      currency: currency.toUpperCase(),
      provider: this.currencyService.getBestProvider(currency),
    };
  }
}
