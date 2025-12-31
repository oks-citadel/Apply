import { Injectable, Logger } from '@nestjs/common';

/**
 * Tax rate configuration by country/region
 */
export interface TaxRate {
  countryCode: string;
  countryName: string;
  region?: string;
  taxType: 'VAT' | 'GST' | 'SALES_TAX' | 'NONE';
  rate: number; // Percentage (e.g., 20 for 20%)
  registrationThreshold?: number;
  registrationRequired: boolean;
  reverseChargeApplicable: boolean;
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  taxType: string;
  countryCode: string;
  currency: string;
  isReverseCharge: boolean;
  taxId?: string;
  breakdown: TaxBreakdownItem[];
}

/**
 * Tax breakdown item for invoices
 */
export interface TaxBreakdownItem {
  description: string;
  rate: number;
  amount: number;
}

/**
 * Customer tax info for validation
 */
export interface CustomerTaxInfo {
  countryCode: string;
  region?: string;
  taxId?: string; // VAT number, GST number, etc.
  isBusinessCustomer: boolean;
  businessName?: string;
}

/**
 * Tax Service
 *
 * Handles tax calculations for global SaaS operations.
 * Supports VAT (EU), GST (AU, IN, NZ, SG), and Sales Tax (US).
 *
 * Features:
 * - Automatic tax rate determination by country
 * - VAT ID validation for EU B2B reverse charge
 * - Tax breakdown for invoicing
 * - Multi-jurisdiction support
 * - Tax exemption handling
 */
@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  /**
   * Tax rates by country
   * Note: In production, these should be fetched from a tax service like TaxJar, Avalara, or Stripe Tax
   */
  private readonly taxRates: Map<string, TaxRate> = new Map([
    // European Union (VAT)
    ['AT', { countryCode: 'AT', countryName: 'Austria', taxType: 'VAT', rate: 20, registrationRequired: true, reverseChargeApplicable: true }],
    ['BE', { countryCode: 'BE', countryName: 'Belgium', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['BG', { countryCode: 'BG', countryName: 'Bulgaria', taxType: 'VAT', rate: 20, registrationRequired: true, reverseChargeApplicable: true }],
    ['HR', { countryCode: 'HR', countryName: 'Croatia', taxType: 'VAT', rate: 25, registrationRequired: true, reverseChargeApplicable: true }],
    ['CY', { countryCode: 'CY', countryName: 'Cyprus', taxType: 'VAT', rate: 19, registrationRequired: true, reverseChargeApplicable: true }],
    ['CZ', { countryCode: 'CZ', countryName: 'Czech Republic', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['DK', { countryCode: 'DK', countryName: 'Denmark', taxType: 'VAT', rate: 25, registrationRequired: true, reverseChargeApplicable: true }],
    ['EE', { countryCode: 'EE', countryName: 'Estonia', taxType: 'VAT', rate: 22, registrationRequired: true, reverseChargeApplicable: true }],
    ['FI', { countryCode: 'FI', countryName: 'Finland', taxType: 'VAT', rate: 24, registrationRequired: true, reverseChargeApplicable: true }],
    ['FR', { countryCode: 'FR', countryName: 'France', taxType: 'VAT', rate: 20, registrationRequired: true, reverseChargeApplicable: true }],
    ['DE', { countryCode: 'DE', countryName: 'Germany', taxType: 'VAT', rate: 19, registrationRequired: true, reverseChargeApplicable: true }],
    ['GR', { countryCode: 'GR', countryName: 'Greece', taxType: 'VAT', rate: 24, registrationRequired: true, reverseChargeApplicable: true }],
    ['HU', { countryCode: 'HU', countryName: 'Hungary', taxType: 'VAT', rate: 27, registrationRequired: true, reverseChargeApplicable: true }],
    ['IE', { countryCode: 'IE', countryName: 'Ireland', taxType: 'VAT', rate: 23, registrationRequired: true, reverseChargeApplicable: true }],
    ['IT', { countryCode: 'IT', countryName: 'Italy', taxType: 'VAT', rate: 22, registrationRequired: true, reverseChargeApplicable: true }],
    ['LV', { countryCode: 'LV', countryName: 'Latvia', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['LT', { countryCode: 'LT', countryName: 'Lithuania', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['LU', { countryCode: 'LU', countryName: 'Luxembourg', taxType: 'VAT', rate: 17, registrationRequired: true, reverseChargeApplicable: true }],
    ['MT', { countryCode: 'MT', countryName: 'Malta', taxType: 'VAT', rate: 18, registrationRequired: true, reverseChargeApplicable: true }],
    ['NL', { countryCode: 'NL', countryName: 'Netherlands', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['PL', { countryCode: 'PL', countryName: 'Poland', taxType: 'VAT', rate: 23, registrationRequired: true, reverseChargeApplicable: true }],
    ['PT', { countryCode: 'PT', countryName: 'Portugal', taxType: 'VAT', rate: 23, registrationRequired: true, reverseChargeApplicable: true }],
    ['RO', { countryCode: 'RO', countryName: 'Romania', taxType: 'VAT', rate: 19, registrationRequired: true, reverseChargeApplicable: true }],
    ['SK', { countryCode: 'SK', countryName: 'Slovakia', taxType: 'VAT', rate: 20, registrationRequired: true, reverseChargeApplicable: true }],
    ['SI', { countryCode: 'SI', countryName: 'Slovenia', taxType: 'VAT', rate: 22, registrationRequired: true, reverseChargeApplicable: true }],
    ['ES', { countryCode: 'ES', countryName: 'Spain', taxType: 'VAT', rate: 21, registrationRequired: true, reverseChargeApplicable: true }],
    ['SE', { countryCode: 'SE', countryName: 'Sweden', taxType: 'VAT', rate: 25, registrationRequired: true, reverseChargeApplicable: true }],

    // United Kingdom (post-Brexit)
    ['GB', { countryCode: 'GB', countryName: 'United Kingdom', taxType: 'VAT', rate: 20, registrationRequired: true, reverseChargeApplicable: false }],

    // GST Countries
    ['AU', { countryCode: 'AU', countryName: 'Australia', taxType: 'GST', rate: 10, registrationRequired: true, reverseChargeApplicable: false }],
    ['NZ', { countryCode: 'NZ', countryName: 'New Zealand', taxType: 'GST', rate: 15, registrationRequired: true, reverseChargeApplicable: false }],
    ['SG', { countryCode: 'SG', countryName: 'Singapore', taxType: 'GST', rate: 9, registrationRequired: true, reverseChargeApplicable: false }],
    ['IN', { countryCode: 'IN', countryName: 'India', taxType: 'GST', rate: 18, registrationRequired: true, reverseChargeApplicable: false }],
    ['CA', { countryCode: 'CA', countryName: 'Canada', taxType: 'GST', rate: 5, registrationRequired: true, reverseChargeApplicable: false }],

    // African Markets
    ['NG', { countryCode: 'NG', countryName: 'Nigeria', taxType: 'VAT', rate: 7.5, registrationRequired: true, reverseChargeApplicable: false }],
    ['GH', { countryCode: 'GH', countryName: 'Ghana', taxType: 'VAT', rate: 15, registrationRequired: true, reverseChargeApplicable: false }],
    ['KE', { countryCode: 'KE', countryName: 'Kenya', taxType: 'VAT', rate: 16, registrationRequired: true, reverseChargeApplicable: false }],
    ['ZA', { countryCode: 'ZA', countryName: 'South Africa', taxType: 'VAT', rate: 15, registrationRequired: true, reverseChargeApplicable: false }],

    // No Tax / Tax-free
    ['US', { countryCode: 'US', countryName: 'United States', taxType: 'SALES_TAX', rate: 0, registrationRequired: false, reverseChargeApplicable: false }], // Varies by state
    ['AE', { countryCode: 'AE', countryName: 'United Arab Emirates', taxType: 'VAT', rate: 5, registrationRequired: true, reverseChargeApplicable: false }],
    ['SA', { countryCode: 'SA', countryName: 'Saudi Arabia', taxType: 'VAT', rate: 15, registrationRequired: true, reverseChargeApplicable: false }],
  ]);

  /**
   * Calculate tax for a transaction
   */
  async calculateTax(
    subtotal: number,
    currency: string,
    customerInfo: CustomerTaxInfo,
    sellerCountryCode: string = 'US', // Our company location
  ): Promise<TaxCalculation> {
    this.logger.log(`Calculating tax for ${currency} ${subtotal} to ${customerInfo.countryCode}`);

    const taxRate = this.getTaxRate(customerInfo.countryCode);
    let effectiveRate = taxRate?.rate || 0;
    let isReverseCharge = false;

    // Check for EU B2B reverse charge
    if (
      taxRate?.reverseChargeApplicable &&
      customerInfo.isBusinessCustomer &&
      customerInfo.taxId &&
      customerInfo.countryCode !== sellerCountryCode
    ) {
      const isValidVat = await this.validateVatNumber(customerInfo.taxId, customerInfo.countryCode);
      if (isValidVat) {
        effectiveRate = 0;
        isReverseCharge = true;
        this.logger.log(`Reverse charge applied for VAT ${customerInfo.taxId}`);
      }
    }

    const taxAmount = Math.round((subtotal * effectiveRate) / 100 * 100) / 100;
    const total = subtotal + taxAmount;

    const breakdown: TaxBreakdownItem[] = [];
    if (effectiveRate > 0) {
      breakdown.push({
        description: `${taxRate?.taxType || 'Tax'} (${effectiveRate}%)`,
        rate: effectiveRate,
        amount: taxAmount,
      });
    } else if (isReverseCharge) {
      breakdown.push({
        description: 'VAT Reverse Charge (0%)',
        rate: 0,
        amount: 0,
      });
    }

    return {
      subtotal,
      taxRate: effectiveRate,
      taxAmount,
      total,
      taxType: taxRate?.taxType || 'NONE',
      countryCode: customerInfo.countryCode,
      currency,
      isReverseCharge,
      taxId: customerInfo.taxId,
      breakdown,
    };
  }

  /**
   * Get tax rate for a country
   */
  getTaxRate(countryCode: string): TaxRate | undefined {
    return this.taxRates.get(countryCode.toUpperCase());
  }

  /**
   * Get all supported tax rates
   */
  getAllTaxRates(): TaxRate[] {
    return Array.from(this.taxRates.values());
  }

  /**
   * Validate VAT number (EU VIES check)
   * In production, this should call the EU VIES API
   */
  async validateVatNumber(vatNumber: string, countryCode: string): Promise<boolean> {
    // Strip country prefix if present
    const cleanVat = vatNumber.replace(/^[A-Z]{2}/i, '').replace(/[\s.-]/g, '');

    // Basic format validation
    const vatFormats: Record<string, RegExp> = {
      AT: /^U\d{8}$/,
      BE: /^0?\d{9,10}$/,
      BG: /^\d{9,10}$/,
      HR: /^\d{11}$/,
      CY: /^\d{8}[A-Z]$/,
      CZ: /^\d{8,10}$/,
      DK: /^\d{8}$/,
      EE: /^\d{9}$/,
      FI: /^\d{8}$/,
      FR: /^[A-Z0-9]{2}\d{9}$/,
      DE: /^\d{9}$/,
      GR: /^\d{9}$/,
      HU: /^\d{8}$/,
      IE: /^\d{7}[A-Z]{1,2}$|^\d[A-Z]\d{5}[A-Z]$/,
      IT: /^\d{11}$/,
      LV: /^\d{11}$/,
      LT: /^\d{9,12}$/,
      LU: /^\d{8}$/,
      MT: /^\d{8}$/,
      NL: /^\d{9}B\d{2}$/,
      PL: /^\d{10}$/,
      PT: /^\d{9}$/,
      RO: /^\d{2,10}$/,
      SK: /^\d{10}$/,
      SI: /^\d{8}$/,
      ES: /^[A-Z]\d{7}[A-Z]$|^\d{8}[A-Z]$|^[A-Z]\d{8}$/,
      SE: /^\d{12}$/,
      GB: /^\d{9}$|^\d{12}$|^GD\d{3}$|^HA\d{3}$/,
    };

    const pattern = vatFormats[countryCode.toUpperCase()];
    if (!pattern) {
      this.logger.warn(`No VAT format defined for country ${countryCode}`);
      return false;
    }

    const isValidFormat = pattern.test(cleanVat);
    if (!isValidFormat) {
      this.logger.warn(`Invalid VAT format for ${countryCode}: ${vatNumber}`);
      return false;
    }

    // In production, call VIES API:
    // https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl
    this.logger.log(`VAT ${countryCode}${cleanVat} format valid (VIES check skipped in dev)`);
    return true;
  }

  /**
   * Generate tax invoice line items
   */
  generateInvoiceTaxLines(calculation: TaxCalculation): string[] {
    const lines: string[] = [];

    lines.push(`Subtotal: ${calculation.currency} ${calculation.subtotal.toFixed(2)}`);

    for (const item of calculation.breakdown) {
      lines.push(`${item.description}: ${calculation.currency} ${item.amount.toFixed(2)}`);
    }

    if (calculation.isReverseCharge) {
      lines.push('Note: VAT reverse charge applies. Customer to account for VAT.');
    }

    lines.push(`Total: ${calculation.currency} ${calculation.total.toFixed(2)}`);

    return lines;
  }

  /**
   * Check if tax registration is required for a country
   */
  isRegistrationRequired(countryCode: string): boolean {
    const rate = this.getTaxRate(countryCode);
    return rate?.registrationRequired ?? false;
  }

  /**
   * Get tax summary for reporting
   */
  async getTaxSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRevenue: number;
    totalTaxCollected: number;
    byCountry: Record<string, { revenue: number; tax: number; transactions: number }>;
    byTaxType: Record<string, { revenue: number; tax: number }>;
  }> {
    // This would query the database for actual transactions
    // Placeholder implementation
    return {
      totalRevenue: 0,
      totalTaxCollected: 0,
      byCountry: {},
      byTaxType: {},
    };
  }
}
