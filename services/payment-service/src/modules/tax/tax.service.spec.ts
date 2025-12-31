import { Test, TestingModule } from '@nestjs/testing';
import { TaxService, TaxRate, TaxCalculation, CustomerTaxInfo } from './tax.service';

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxService],
    }).compile();

    service = module.get<TaxService>(TaxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaxRate', () => {
    describe('EU VAT Countries', () => {
      it.each([
        ['AT', 'Austria', 20],
        ['BE', 'Belgium', 21],
        ['BG', 'Bulgaria', 20],
        ['HR', 'Croatia', 25],
        ['CY', 'Cyprus', 19],
        ['CZ', 'Czech Republic', 21],
        ['DK', 'Denmark', 25],
        ['EE', 'Estonia', 22],
        ['FI', 'Finland', 24],
        ['FR', 'France', 20],
        ['DE', 'Germany', 19],
        ['GR', 'Greece', 24],
        ['HU', 'Hungary', 27],
        ['IE', 'Ireland', 23],
        ['IT', 'Italy', 22],
        ['LV', 'Latvia', 21],
        ['LT', 'Lithuania', 21],
        ['LU', 'Luxembourg', 17],
        ['MT', 'Malta', 18],
        ['NL', 'Netherlands', 21],
        ['PL', 'Poland', 23],
        ['PT', 'Portugal', 23],
        ['RO', 'Romania', 19],
        ['SK', 'Slovakia', 20],
        ['SI', 'Slovenia', 22],
        ['ES', 'Spain', 21],
        ['SE', 'Sweden', 25],
      ])('should return correct VAT rate for %s (%s) at %d%%', (code, name, rate) => {
        const result = service.getTaxRate(code);

        expect(result).toBeDefined();
        expect(result!.countryCode).toBe(code);
        expect(result!.countryName).toBe(name);
        expect(result!.taxType).toBe('VAT');
        expect(result!.rate).toBe(rate);
        expect(result!.reverseChargeApplicable).toBe(true);
      });
    });

    describe('GST Countries', () => {
      it.each([
        ['AU', 'Australia', 10],
        ['NZ', 'New Zealand', 15],
        ['SG', 'Singapore', 9],
        ['IN', 'India', 18],
        ['CA', 'Canada', 5],
      ])('should return correct GST rate for %s (%s) at %d%%', (code, name, rate) => {
        const result = service.getTaxRate(code);

        expect(result).toBeDefined();
        expect(result!.countryCode).toBe(code);
        expect(result!.countryName).toBe(name);
        expect(result!.taxType).toBe('GST');
        expect(result!.rate).toBe(rate);
        expect(result!.reverseChargeApplicable).toBe(false);
      });
    });

    describe('African Markets', () => {
      it.each([
        ['NG', 'Nigeria', 7.5],
        ['GH', 'Ghana', 15],
        ['KE', 'Kenya', 16],
        ['ZA', 'South Africa', 15],
      ])('should return correct VAT rate for %s (%s) at %d%%', (code, name, rate) => {
        const result = service.getTaxRate(code);

        expect(result).toBeDefined();
        expect(result!.countryCode).toBe(code);
        expect(result!.countryName).toBe(name);
        expect(result!.taxType).toBe('VAT');
        expect(result!.rate).toBe(rate);
      });
    });

    describe('United Kingdom (post-Brexit)', () => {
      it('should return UK VAT rate without reverse charge', () => {
        const result = service.getTaxRate('GB');

        expect(result).toBeDefined();
        expect(result!.countryCode).toBe('GB');
        expect(result!.countryName).toBe('United Kingdom');
        expect(result!.taxType).toBe('VAT');
        expect(result!.rate).toBe(20);
        expect(result!.reverseChargeApplicable).toBe(false);
      });
    });

    describe('Case Insensitivity', () => {
      it('should handle lowercase country codes', () => {
        const result = service.getTaxRate('de');
        expect(result?.countryCode).toBe('DE');
      });

      it('should handle mixed case country codes', () => {
        const result = service.getTaxRate('De');
        expect(result?.countryCode).toBe('DE');
      });
    });

    describe('Unknown Countries', () => {
      it('should return undefined for unknown country code', () => {
        const result = service.getTaxRate('XX');
        expect(result).toBeUndefined();
      });

      it('should return undefined for empty country code', () => {
        const result = service.getTaxRate('');
        expect(result).toBeUndefined();
      });
    });
  });

  describe('getAllTaxRates', () => {
    it('should return all configured tax rates', () => {
      const result = service.getAllTaxRates();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(30);
    });

    it('should include major markets', () => {
      const result = service.getAllTaxRates();
      const countryCodes = result.map(r => r.countryCode);

      expect(countryCodes).toContain('US');
      expect(countryCodes).toContain('DE');
      expect(countryCodes).toContain('GB');
      expect(countryCodes).toContain('FR');
      expect(countryCodes).toContain('NG');
    });
  });

  describe('calculateTax', () => {
    describe('Standard B2C Calculations', () => {
      it('should calculate German VAT correctly', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'USD', customerInfo);

        expect(result.subtotal).toBe(100);
        expect(result.taxRate).toBe(19);
        expect(result.taxAmount).toBe(19);
        expect(result.total).toBe(119);
        expect(result.taxType).toBe('VAT');
        expect(result.isReverseCharge).toBe(false);
      });

      it('should calculate UK VAT correctly', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'GB',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'GBP', customerInfo);

        expect(result.subtotal).toBe(100);
        expect(result.taxRate).toBe(20);
        expect(result.taxAmount).toBe(20);
        expect(result.total).toBe(120);
        expect(result.currency).toBe('GBP');
      });

      it('should calculate French VAT correctly', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'FR',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(49.99, 'EUR', customerInfo);

        expect(result.subtotal).toBe(49.99);
        expect(result.taxRate).toBe(20);
        expect(result.taxAmount).toBe(10); // Rounded
        expect(result.total).toBe(59.99);
      });

      it('should calculate Australian GST correctly', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'AU',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'AUD', customerInfo);

        expect(result.taxType).toBe('GST');
        expect(result.taxRate).toBe(10);
        expect(result.taxAmount).toBe(10);
        expect(result.total).toBe(110);
      });

      it('should calculate Nigerian VAT correctly', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'NG',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'NGN', customerInfo);

        expect(result.taxRate).toBe(7.5);
        expect(result.taxAmount).toBe(7.5);
        expect(result.total).toBe(107.5);
      });
    });

    describe('B2B Reverse Charge (EU)', () => {
      it('should apply reverse charge for valid EU B2B transaction', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: true,
          taxId: 'DE123456789',
        };

        // Mocking VIES validation would pass
        const result = await service.calculateTax(100, 'EUR', customerInfo);

        expect(result.taxRate).toBe(0);
        expect(result.taxAmount).toBe(0);
        expect(result.total).toBe(100);
        expect(result.isReverseCharge).toBe(true);
        expect(result.taxId).toBe('DE123456789');
      });

      it('should not apply reverse charge when taxId is missing', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: true,
        };

        const result = await service.calculateTax(100, 'EUR', customerInfo);

        expect(result.taxRate).toBe(19);
        expect(result.isReverseCharge).toBe(false);
      });

      it('should not apply reverse charge for non-EU countries', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'AU',
          isBusinessCustomer: true,
          taxId: 'AU12345678901',
        };

        const result = await service.calculateTax(100, 'AUD', customerInfo);

        expect(result.taxRate).toBe(10);
        expect(result.isReverseCharge).toBe(false);
      });

      it('should not apply reverse charge when seller and customer in same country', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'US',
          isBusinessCustomer: true,
          taxId: 'US123456789',
        };

        const result = await service.calculateTax(100, 'USD', customerInfo, 'US');

        expect(result.isReverseCharge).toBe(false);
      });
    });

    describe('Tax Breakdown', () => {
      it('should include breakdown for standard tax', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'EUR', customerInfo);

        expect(result.breakdown).toHaveLength(1);
        expect(result.breakdown[0].description).toBe('VAT (19%)');
        expect(result.breakdown[0].rate).toBe(19);
        expect(result.breakdown[0].amount).toBe(19);
      });

      it('should include breakdown for reverse charge', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'FR',
          isBusinessCustomer: true,
          taxId: 'FR12345678901',
        };

        const result = await service.calculateTax(100, 'EUR', customerInfo);

        expect(result.breakdown).toHaveLength(1);
        expect(result.breakdown[0].description).toBe('VAT Reverse Charge (0%)');
        expect(result.breakdown[0].amount).toBe(0);
      });

      it('should have empty breakdown for zero-tax countries', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'US',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'USD', customerInfo);

        expect(result.taxRate).toBe(0);
        expect(result.breakdown).toHaveLength(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero amount', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(0, 'EUR', customerInfo);

        expect(result.subtotal).toBe(0);
        expect(result.taxAmount).toBe(0);
        expect(result.total).toBe(0);
      });

      it('should handle very small amounts', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(0.01, 'EUR', customerInfo);

        expect(result.subtotal).toBe(0.01);
        expect(result.taxAmount).toBe(0); // Rounds to 0
        expect(result.total).toBe(0.01);
      });

      it('should handle very large amounts', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(999999.99, 'EUR', customerInfo);

        expect(result.subtotal).toBe(999999.99);
        expect(result.taxAmount).toBe(190000); // 19% of ~1M
        expect(result.total).toBe(1189999.99);
      });

      it('should round tax amount to 2 decimal places', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'HU', // 27% VAT
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(33.33, 'EUR', customerInfo);

        // 33.33 * 0.27 = 8.9991, should round to 9.00
        expect(result.taxAmount).toBe(9);
        expect(result.total).toBe(42.33);
      });

      it('should handle unknown country with zero tax', async () => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'XX',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, 'USD', customerInfo);

        expect(result.taxRate).toBe(0);
        expect(result.taxAmount).toBe(0);
        expect(result.total).toBe(100);
        expect(result.taxType).toBe('NONE');
      });
    });

    describe('Currency Handling', () => {
      it.each([
        ['USD', 'US Dollars'],
        ['EUR', 'Euros'],
        ['GBP', 'British Pounds'],
        ['NGN', 'Nigerian Naira'],
        ['ZAR', 'South African Rand'],
      ])('should preserve currency in result for %s', async (currency) => {
        const customerInfo: CustomerTaxInfo = {
          countryCode: 'DE',
          isBusinessCustomer: false,
        };

        const result = await service.calculateTax(100, currency, customerInfo);

        expect(result.currency).toBe(currency);
      });
    });
  });

  describe('validateVatNumber', () => {
    describe('Valid VAT Formats', () => {
      it.each([
        ['DE', 'DE123456789', true],
        ['FR', 'FR12345678901', true],
        ['GB', 'GB123456789', true],
        ['GB', 'GB123456789012', true],
        ['IT', 'IT12345678901', true],
        ['ES', 'ESA12345678', true],
        ['NL', 'NL123456789B01', true],
        ['PL', 'PL1234567890', true],
        ['BE', 'BE0123456789', true],
      ])('should validate VAT number for %s: %s', async (country, vatNumber, expected) => {
        const result = await service.validateVatNumber(vatNumber, country);
        expect(result).toBe(expected);
      });
    });

    describe('Invalid VAT Formats', () => {
      it('should reject VAT number with wrong length', async () => {
        const result = await service.validateVatNumber('DE12345', 'DE');
        expect(result).toBe(false);
      });

      it('should reject VAT number with invalid characters', async () => {
        const result = await service.validateVatNumber('DE12345678X', 'DE');
        expect(result).toBe(false);
      });

      it('should reject VAT number with wrong prefix and wrong format', async () => {
        // FR VAT numbers have 11 digits after prefix, DE has 9 digits
        // Using a clearly invalid format for Germany (wrong length)
        const result = await service.validateVatNumber('FR12345678901', 'DE');
        expect(result).toBe(false);
      });
    });

    describe('Country Code Handling', () => {
      it('should handle lowercase country codes', async () => {
        const result = await service.validateVatNumber('DE123456789', 'de');
        expect(result).toBe(true);
      });

      it('should strip country prefix from VAT number', async () => {
        const result = await service.validateVatNumber('DE123456789', 'DE');
        expect(result).toBe(true);
      });

      it('should return false for unsupported country', async () => {
        const result = await service.validateVatNumber('XX123456789', 'XX');
        expect(result).toBe(false);
      });
    });

    describe('Whitespace and Formatting', () => {
      it('should handle VAT number with spaces', async () => {
        const result = await service.validateVatNumber('DE 123 456 789', 'DE');
        expect(result).toBe(true);
      });

      it('should handle VAT number with dots', async () => {
        const result = await service.validateVatNumber('DE.123.456.789', 'DE');
        expect(result).toBe(true);
      });

      it('should handle VAT number with dashes', async () => {
        const result = await service.validateVatNumber('DE-123-456-789', 'DE');
        expect(result).toBe(true);
      });
    });
  });

  describe('generateInvoiceTaxLines', () => {
    it('should generate lines for standard tax calculation', () => {
      const calculation: TaxCalculation = {
        subtotal: 100,
        taxRate: 19,
        taxAmount: 19,
        total: 119,
        taxType: 'VAT',
        countryCode: 'DE',
        currency: 'EUR',
        isReverseCharge: false,
        breakdown: [{ description: 'VAT (19%)', rate: 19, amount: 19 }],
      };

      const result = service.generateInvoiceTaxLines(calculation);

      expect(result).toContain('Subtotal: EUR 100.00');
      expect(result).toContain('VAT (19%): EUR 19.00');
      expect(result).toContain('Total: EUR 119.00');
    });

    it('should generate lines for reverse charge', () => {
      const calculation: TaxCalculation = {
        subtotal: 100,
        taxRate: 0,
        taxAmount: 0,
        total: 100,
        taxType: 'VAT',
        countryCode: 'DE',
        currency: 'EUR',
        isReverseCharge: true,
        taxId: 'DE123456789',
        breakdown: [{ description: 'VAT Reverse Charge (0%)', rate: 0, amount: 0 }],
      };

      const result = service.generateInvoiceTaxLines(calculation);

      expect(result).toContain('Subtotal: EUR 100.00');
      expect(result).toContain('VAT Reverse Charge (0%): EUR 0.00');
      expect(result).toContain('Note: VAT reverse charge applies. Customer to account for VAT.');
      expect(result).toContain('Total: EUR 100.00');
    });

    it('should generate lines for zero-tax calculation', () => {
      const calculation: TaxCalculation = {
        subtotal: 100,
        taxRate: 0,
        taxAmount: 0,
        total: 100,
        taxType: 'NONE',
        countryCode: 'US',
        currency: 'USD',
        isReverseCharge: false,
        breakdown: [],
      };

      const result = service.generateInvoiceTaxLines(calculation);

      expect(result).toContain('Subtotal: USD 100.00');
      expect(result).toContain('Total: USD 100.00');
      expect(result).not.toContain('VAT');
    });
  });

  describe('isRegistrationRequired', () => {
    it('should return true for EU countries', () => {
      expect(service.isRegistrationRequired('DE')).toBe(true);
      expect(service.isRegistrationRequired('FR')).toBe(true);
      expect(service.isRegistrationRequired('ES')).toBe(true);
    });

    it('should return true for GST countries', () => {
      expect(service.isRegistrationRequired('AU')).toBe(true);
      expect(service.isRegistrationRequired('NZ')).toBe(true);
      expect(service.isRegistrationRequired('SG')).toBe(true);
    });

    it('should return false for US (varies by state)', () => {
      expect(service.isRegistrationRequired('US')).toBe(false);
    });

    it('should return false for unknown country', () => {
      expect(service.isRegistrationRequired('XX')).toBe(false);
    });
  });

  describe('getTaxSummary', () => {
    it('should return empty summary (placeholder implementation)', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await service.getTaxSummary(startDate, endDate);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalTaxCollected).toBe(0);
      expect(result.byCountry).toEqual({});
      expect(result.byTaxType).toEqual({});
    });
  });

  describe('Tax Rate Consistency', () => {
    it('should have consistent rates between getTaxRate and calculateTax', async () => {
      const countries = ['DE', 'FR', 'GB', 'AU', 'NG'];

      for (const countryCode of countries) {
        const taxRate = service.getTaxRate(countryCode);
        const calculation = await service.calculateTax(100, 'USD', {
          countryCode,
          isBusinessCustomer: false,
        });

        expect(calculation.taxRate).toBe(taxRate?.rate || 0);
      }
    });
  });

  describe('Highest VAT Rates', () => {
    it('should correctly identify Hungary as highest EU VAT', async () => {
      const allRates = service.getAllTaxRates();
      const euRates = allRates.filter(r => r.taxType === 'VAT' && r.reverseChargeApplicable);
      const maxRate = Math.max(...euRates.map(r => r.rate));

      expect(maxRate).toBe(27); // Hungary
    });

    it('should correctly identify Luxembourg as lowest EU VAT', async () => {
      const allRates = service.getAllTaxRates();
      const euRates = allRates.filter(r => r.taxType === 'VAT' && r.reverseChargeApplicable);
      const minRate = Math.min(...euRates.map(r => r.rate));

      expect(minRate).toBe(17); // Luxembourg
    });
  });
});
