import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService, CurrencyConfig, ConvertedAmount } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyService],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSupportedCurrencies', () => {
    it('should return all supported currencies', () => {
      const currencies = service.getSupportedCurrencies();

      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(20);
    });

    it('should include major currencies', () => {
      const currencies = service.getSupportedCurrencies();
      const codes = currencies.map(c => c.code);

      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('GBP');
      expect(codes).toContain('JPY');
      expect(codes).toContain('CAD');
      expect(codes).toContain('AUD');
    });

    it('should include African currencies', () => {
      const currencies = service.getSupportedCurrencies();
      const codes = currencies.map(c => c.code);

      expect(codes).toContain('NGN');
      expect(codes).toContain('GHS');
      expect(codes).toContain('KES');
      expect(codes).toContain('ZAR');
      expect(codes).toContain('UGX');
    });
  });

  describe('getCurrency', () => {
    it('should return currency configuration for valid code', () => {
      const usd = service.getCurrency('USD');

      expect(usd).toBeDefined();
      expect(usd!.code).toBe('USD');
      expect(usd!.name).toBe('US Dollar');
      expect(usd!.symbol).toBe('$');
      expect(usd!.decimalPlaces).toBe(2);
    });

    it('should handle lowercase currency codes', () => {
      const usd = service.getCurrency('usd');

      expect(usd).toBeDefined();
      expect(usd!.code).toBe('USD');
    });

    it('should return undefined for unknown currency', () => {
      const unknown = service.getCurrency('XXX');

      expect(unknown).toBeUndefined();
    });

    it('should return correct configuration for zero-decimal currencies', () => {
      const jpy = service.getCurrency('JPY');

      expect(jpy).toBeDefined();
      expect(jpy!.decimalPlaces).toBe(0);
    });

    it.each([
      ['USD', 2],
      ['EUR', 2],
      ['GBP', 2],
      ['JPY', 0],
      ['UGX', 0],
      ['RWF', 0],
    ])('should return correct decimal places for %s: %d', (code, expectedDecimals) => {
      const currency = service.getCurrency(code);

      expect(currency!.decimalPlaces).toBe(expectedDecimals);
    });
  });

  describe('getCurrenciesByProvider', () => {
    it('should return Stripe-supported currencies', () => {
      const stripeCurrencies = service.getCurrenciesByProvider('stripe');

      expect(stripeCurrencies.length).toBeGreaterThan(0);
      expect(stripeCurrencies.every(c => c.stripeSupported)).toBe(true);
    });

    it('should return Flutterwave-supported currencies', () => {
      const flutterwaveCurrencies = service.getCurrenciesByProvider('flutterwave');

      expect(flutterwaveCurrencies.length).toBeGreaterThan(0);
      expect(flutterwaveCurrencies.every(c => c.flutterwaveSupported)).toBe(true);
    });

    it('should return Paystack-supported currencies', () => {
      const paystackCurrencies = service.getCurrenciesByProvider('paystack');

      expect(paystackCurrencies.length).toBeGreaterThan(0);
      expect(paystackCurrencies.every(c => c.paystackSupported)).toBe(true);
    });

    it('should include NGN in Flutterwave and Paystack', () => {
      const flutterwaveCurrencies = service.getCurrenciesByProvider('flutterwave');
      const paystackCurrencies = service.getCurrenciesByProvider('paystack');

      expect(flutterwaveCurrencies.find(c => c.code === 'NGN')).toBeDefined();
      expect(paystackCurrencies.find(c => c.code === 'NGN')).toBeDefined();
    });

    it('should not include African currencies in Stripe', () => {
      const stripeCurrencies = service.getCurrenciesByProvider('stripe');

      expect(stripeCurrencies.find(c => c.code === 'NGN')).toBeUndefined();
      expect(stripeCurrencies.find(c => c.code === 'GHS')).toBeUndefined();
    });
  });

  describe('convert', () => {
    it('should convert USD to EUR', async () => {
      const result = await service.convert(100, 'USD', 'EUR');

      expect(result.originalAmount).toBe(100);
      expect(result.originalCurrency).toBe('USD');
      expect(result.targetCurrency).toBe('EUR');
      expect(result.convertedAmount).toBeGreaterThan(0);
      expect(result.convertedAmount).toBeLessThan(100); // EUR is stronger
    });

    it('should convert EUR to USD', async () => {
      const result = await service.convert(100, 'EUR', 'USD');

      expect(result.originalAmount).toBe(100);
      expect(result.convertedAmount).toBeGreaterThan(100); // USD is weaker
    });

    it('should return same amount for same currency', async () => {
      const result = await service.convert(100, 'USD', 'USD');

      expect(result.convertedAmount).toBe(100);
      expect(result.exchangeRate).toBe(1);
    });

    it('should throw error for unsupported currency', async () => {
      await expect(service.convert(100, 'XXX', 'USD')).rejects.toThrow(
        'Unsupported currency',
      );
    });

    it('should handle conversion to zero-decimal currencies', async () => {
      const result = await service.convert(100, 'USD', 'JPY');

      // JPY should be a whole number
      expect(Number.isInteger(result.convertedAmount)).toBe(true);
    });

    it('should include timestamp in result', async () => {
      const result = await service.convert(100, 'USD', 'EUR');

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle large amounts', async () => {
      const result = await service.convert(1000000, 'USD', 'NGN');

      expect(result.convertedAmount).toBeGreaterThan(1000000);
    });

    it('should handle small amounts', async () => {
      const result = await service.convert(0.01, 'USD', 'EUR');

      expect(result.convertedAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate between two currencies', () => {
      const rate = service.getExchangeRate('USD', 'EUR');

      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1); // EUR is stronger
    });

    it('should return 1 for same currency', () => {
      const rate = service.getExchangeRate('USD', 'USD');

      expect(rate).toBe(1);
    });

    it('should throw error for unsupported currency', () => {
      expect(() => service.getExchangeRate('XXX', 'USD')).toThrow(
        'Unsupported currency pair',
      );
    });

    it('should return inverse rates correctly', () => {
      const usdToEur = service.getExchangeRate('USD', 'EUR');
      const eurToUsd = service.getExchangeRate('EUR', 'USD');

      // Product should be approximately 1
      expect(usdToEur * eurToUsd).toBeCloseTo(1, 4);
    });
  });

  describe('getAllExchangeRates', () => {
    it('should return all exchange rates', () => {
      const rates = service.getAllExchangeRates();

      expect(typeof rates).toBe('object');
      expect(rates['USD']).toBe(1);
      expect(rates['EUR']).toBeDefined();
      expect(rates['GBP']).toBeDefined();
    });

    it('should include African currency rates', () => {
      const rates = service.getAllExchangeRates();

      expect(rates['NGN']).toBeDefined();
      expect(rates['GHS']).toBeDefined();
      expect(rates['KES']).toBeDefined();
    });
  });

  describe('formatAmount', () => {
    it('should format USD amount correctly', () => {
      const formatted = service.formatAmount(1234.56, 'USD');

      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('$');
    });

    it('should format EUR amount correctly', () => {
      const formatted = service.formatAmount(1234.56, 'EUR', 'de-DE');

      expect(formatted).toContain('1.234,56');
    });

    it('should format JPY without decimals', () => {
      const formatted = service.formatAmount(1234, 'JPY');

      expect(formatted).not.toContain('.');
    });

    it('should handle unknown currency gracefully', () => {
      const formatted = service.formatAmount(100, 'XXX');

      expect(formatted).toBe('100 XXX');
    });

    it('should format NGN correctly', () => {
      const formatted = service.formatAmount(10000, 'NGN');

      expect(formatted).toContain('10,000');
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert USD to cents', () => {
      const cents = service.toSmallestUnit(10.50, 'USD');

      expect(cents).toBe(1050);
    });

    it('should convert EUR to cents', () => {
      const cents = service.toSmallestUnit(10.50, 'EUR');

      expect(cents).toBe(1050);
    });

    it('should handle JPY (zero decimal)', () => {
      const result = service.toSmallestUnit(1000, 'JPY');

      expect(result).toBe(1000);
    });

    it('should convert NGN to kobo', () => {
      const kobo = service.toSmallestUnit(100, 'NGN');

      expect(kobo).toBe(10000);
    });

    it('should handle rounding', () => {
      const cents = service.toSmallestUnit(10.555, 'USD');

      expect(cents).toBe(1056); // Rounded
    });
  });

  describe('fromSmallestUnit', () => {
    it('should convert cents to USD', () => {
      const dollars = service.fromSmallestUnit(1050, 'USD');

      expect(dollars).toBe(10.50);
    });

    it('should convert kobo to NGN', () => {
      const naira = service.fromSmallestUnit(10000, 'NGN');

      expect(naira).toBe(100);
    });

    it('should handle JPY (zero decimal)', () => {
      const yen = service.fromSmallestUnit(1000, 'JPY');

      expect(yen).toBe(1000);
    });
  });

  describe('meetsMinimumCharge', () => {
    it('should return true when amount meets minimum for USD', () => {
      const result = service.meetsMinimumCharge(1.00, 'USD');

      expect(result).toBe(true);
    });

    it('should return false when amount is below minimum', () => {
      const result = service.meetsMinimumCharge(0.01, 'USD');

      expect(result).toBe(false);
    });

    it('should handle NGN minimum charge', () => {
      // NGN minimum is typically higher (10000 kobo = 100 NGN)
      expect(service.meetsMinimumCharge(150, 'NGN')).toBe(true);
      expect(service.meetsMinimumCharge(50, 'NGN')).toBe(false);
    });

    it('should return false for unknown currency', () => {
      const result = service.meetsMinimumCharge(100, 'XXX');

      expect(result).toBe(false);
    });
  });

  describe('getBestProvider', () => {
    it('should return Stripe for USD', () => {
      const provider = service.getBestProvider('USD');

      expect(provider).toBe('stripe');
    });

    it('should return Stripe for EUR', () => {
      const provider = service.getBestProvider('EUR');

      expect(provider).toBe('stripe');
    });

    it('should return Flutterwave for NGN', () => {
      const provider = service.getBestProvider('NGN');

      expect(provider).toBe('flutterwave');
    });

    it('should return null for unsupported currency', () => {
      const provider = service.getBestProvider('XXX');

      expect(provider).toBeNull();
    });

    it.each([
      ['USD', 'stripe'],
      ['EUR', 'stripe'],
      ['GBP', 'stripe'],
      ['NGN', 'flutterwave'],
      ['GHS', 'flutterwave'],
      ['KES', 'flutterwave'],
      ['ZAR', 'flutterwave'],
    ])('should return correct provider for %s: %s', (currency, expectedProvider) => {
      const provider = service.getBestProvider(currency);

      expect(provider).toBe(expectedProvider);
    });
  });

  describe('getCurrencyByCountry', () => {
    it('should return USD for US', () => {
      const currency = service.getCurrencyByCountry('US');

      expect(currency).toBe('USD');
    });

    it('should return EUR for EU countries', () => {
      expect(service.getCurrencyByCountry('DE')).toBe('EUR');
      expect(service.getCurrencyByCountry('FR')).toBe('EUR');
      expect(service.getCurrencyByCountry('ES')).toBe('EUR');
      expect(service.getCurrencyByCountry('IT')).toBe('EUR');
    });

    it('should return GBP for UK', () => {
      const currency = service.getCurrencyByCountry('GB');

      expect(currency).toBe('GBP');
    });

    it('should return NGN for Nigeria', () => {
      const currency = service.getCurrencyByCountry('NG');

      expect(currency).toBe('NGN');
    });

    it('should return USD for unknown country', () => {
      const currency = service.getCurrencyByCountry('XX');

      expect(currency).toBe('USD');
    });

    it('should handle lowercase country codes', () => {
      const currency = service.getCurrencyByCountry('us');

      expect(currency).toBe('USD');
    });

    it.each([
      ['NG', 'NGN'],
      ['GH', 'GHS'],
      ['KE', 'KES'],
      ['ZA', 'ZAR'],
      ['UG', 'UGX'],
      ['TZ', 'TZS'],
      ['EG', 'EGP'],
      ['AE', 'AED'],
      ['SA', 'SAR'],
    ])('should return correct currency for %s: %s', (country, expectedCurrency) => {
      const currency = service.getCurrencyByCountry(country);

      expect(currency).toBe(expectedCurrency);
    });
  });

  describe('Exchange Rate Updates', () => {
    it('should update exchange rates', async () => {
      const ratesBefore = service.getAllExchangeRates();
      const eurRateBefore = ratesBefore['EUR'];

      await service.updateExchangeRates();

      const ratesAfter = service.getAllExchangeRates();
      // Rate might fluctuate slightly, but should still be close
      expect(ratesAfter['EUR']).toBeCloseTo(eurRateBefore, 1);
    });

    it('should maintain USD as base currency', async () => {
      await service.updateExchangeRates();

      const rates = service.getAllExchangeRates();
      expect(rates['USD']).toBe(1);
    });
  });

  describe('Currency Configuration Properties', () => {
    it('should have all required properties for each currency', () => {
      const currencies = service.getSupportedCurrencies();

      currencies.forEach(currency => {
        expect(currency.code).toBeDefined();
        expect(currency.name).toBeDefined();
        expect(currency.symbol).toBeDefined();
        expect(typeof currency.decimalPlaces).toBe('number');
        expect(typeof currency.stripeSupported).toBe('boolean');
        expect(typeof currency.flutterwaveSupported).toBe('boolean');
        expect(typeof currency.paystackSupported).toBe('boolean');
        expect(typeof currency.minimumCharge).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount conversion', async () => {
      const result = await service.convert(0, 'USD', 'EUR');

      expect(result.convertedAmount).toBe(0);
    });

    it('should handle negative amount conversion', async () => {
      const result = await service.convert(-100, 'USD', 'EUR');

      expect(result.convertedAmount).toBeLessThan(0);
    });

    it('should format zero amount correctly', () => {
      const formatted = service.formatAmount(0, 'USD');

      expect(formatted).toContain('0');
    });

    it('should handle very large amounts in toSmallestUnit', () => {
      const cents = service.toSmallestUnit(999999999.99, 'USD');

      expect(cents).toBe(99999999999);
    });
  });
});
