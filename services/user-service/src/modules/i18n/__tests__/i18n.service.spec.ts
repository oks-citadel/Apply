import { HttpService } from '@nestjs/axios';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';

import { UserLocalePreference } from '../entities/user-locale-preference.entity';
import { I18nService } from '../i18n.service';



import type { TestingModule } from '@nestjs/testing';
import type { AxiosResponse } from 'axios';
import type { Repository } from 'typeorm';

describe('I18nService', () => {
  let service: I18nService;
  let localePreferenceRepository: Repository<UserLocalePreference>;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockLocalePreferenceRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: getRepositoryToken(UserLocalePreference),
          useValue: mockLocalePreferenceRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
    localePreferenceRepository = module.get<Repository<UserLocalePreference>>(
      getRepositoryToken(UserLocalePreference),
    );
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableLanguages', () => {
    it('should return all supported languages', async () => {
      const result = await service.getAvailableLanguages();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include language code, name, and native name', async () => {
      const result = await service.getAvailableLanguages();

      result.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('direction');
      });
    });

    it('should include English as default language', async () => {
      const result = await service.getAvailableLanguages();

      const english = result.find(lang => lang.code === 'en');
      expect(english).toBeDefined();
      expect(english.name).toBe('English');
    });

    it('should mark RTL languages correctly', async () => {
      const result = await service.getAvailableLanguages();

      const arabic = result.find(lang => lang.code === 'ar');
      const hebrew = result.find(lang => lang.code === 'he');

      if (arabic) {
        expect(arabic.direction).toBe('rtl');
      }
      if (hebrew) {
        expect(hebrew.direction).toBe('rtl');
      }
    });

    it('should mark LTR languages correctly', async () => {
      const result = await service.getAvailableLanguages();

      const english = result.find(lang => lang.code === 'en');
      const spanish = result.find(lang => lang.code === 'es');

      expect(english.direction).toBe('ltr');
      if (spanish) {
        expect(spanish.direction).toBe('ltr');
      }
    });

    it('should cache language list for performance', async () => {
      const firstCall = await service.getAvailableLanguages();
      const secondCall = await service.getAvailableLanguages();

      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('getTranslations', () => {
    it('should return translations for English', async () => {
      const result = await service.getTranslations('en');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return translations for Spanish', async () => {
      const result = await service.getTranslations('es');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should throw NotFoundException for unsupported locale', async () => {
      await expect(service.getTranslations('xx')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate locale format', async () => {
      await expect(service.getTranslations('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return fallback translations when locale file is missing', async () => {
      const result = await service.getTranslations('en-US', 'en');

      expect(result).toBeDefined();
    });

    it('should include all translation namespaces', async () => {
      const result = await service.getTranslations('en');

      expect(result).toHaveProperty('common');
      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('applications');
    });

    it('should handle nested translation keys', async () => {
      const result = await service.getTranslations('en');

      if (result.dashboard && result.dashboard.stats) {
        expect(typeof result.dashboard.stats).toBe('object');
      }
    });

    it('should support locale variants (en-US, en-GB)', async () => {
      const usTranslations = await service.getTranslations('en-US');
      const gbTranslations = await service.getTranslations('en-GB');

      expect(usTranslations).toBeDefined();
      expect(gbTranslations).toBeDefined();
    });

    it('should cache translations for better performance', async () => {
      const spy = jest.spyOn(service as any, 'loadTranslationFile');

      await service.getTranslations('en');
      await service.getTranslations('en');

      // Should only load once due to caching
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });

  describe('convertCurrency', () => {
    it('should convert USD to EUR', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          result: 'success',
          conversion_rates: { EUR: 0.925 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockConfigService.get.mockReturnValue('mock-api-key');

      const result = await service.convertCurrency({
        amount: 100,
        from: 'USD',
        to: 'EUR',
      });

      expect(result.convertedAmount).toBeCloseTo(92.5, 2);
      expect(result.rate).toBeCloseTo(0.925, 3);
    });

    it('should handle same currency conversion', async () => {
      const result = await service.convertCurrency({
        amount: 100,
        from: 'USD',
        to: 'USD',
      });

      expect(result.convertedAmount).toBe(100);
      expect(result.rate).toBe(1);
    });

    it('should validate currency codes', async () => {
      await expect(
        service.convertCurrency({
          amount: 100,
          from: 'INVALID',
          to: 'EUR',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle negative amounts', async () => {
      await expect(
        service.convertCurrency({
          amount: -100,
          from: 'USD',
          to: 'EUR',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle zero amount', async () => {
      const result = await service.convertCurrency({
        amount: 0,
        from: 'USD',
        to: 'EUR',
      });

      expect(result.convertedAmount).toBe(0);
    });

    it('should cache exchange rates', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          result: 'success',
          conversion_rates: { EUR: 0.925 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockConfigService.get.mockReturnValue('mock-api-key');

      await service.convertCurrency({ amount: 100, from: 'USD', to: 'EUR' });
      await service.convertCurrency({ amount: 200, from: 'USD', to: 'EUR' });

      // Should only call API once due to caching
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );
      mockConfigService.get.mockReturnValue('mock-api-key');

      await expect(
        service.convertCurrency({ amount: 100, from: 'USD', to: 'EUR' }),
      ).rejects.toThrow();
    });

    it('should include timestamp in response', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          result: 'success',
          conversion_rates: { EUR: 0.925 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));
      mockConfigService.get.mockReturnValue('mock-api-key');

      const result = await service.convertCurrency({
        amount: 100,
        from: 'USD',
        to: 'EUR',
      });

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should support multiple currency codes', async () => {
      const currencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

      for (const currency of currencies) {
        const mockResponse: AxiosResponse = {
          data: {
            result: 'success',
            conversion_rates: { [currency]: 1.0 },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };

        mockHttpService.get.mockReturnValue(of(mockResponse));
        mockConfigService.get.mockReturnValue('mock-api-key');

        const result = await service.convertCurrency({
          amount: 100,
          from: 'USD',
          to: currency,
        });

        expect(result.to).toBe(currency);
      }
    });
  });

  describe('updateUserLocale', () => {
    it('should update user locale preferences', async () => {
      const userId = 'user-123';
      const localeData = {
        locale: 'es',
        timezone: 'Europe/Madrid',
        currency: 'EUR',
      };

      const existingPreference = {
        id: '1',
        userId,
        locale: 'en',
        timezone: 'UTC',
        currency: 'USD',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(existingPreference);
      mockLocalePreferenceRepository.save.mockResolvedValue({
        ...existingPreference,
        ...localeData,
      });

      const result = await service.updateUserLocale(userId, localeData);

      expect(result.locale).toBe('es');
      expect(result.timezone).toBe('Europe/Madrid');
      expect(result.currency).toBe('EUR');
    });

    it('should create new preference if not exists', async () => {
      const userId = 'user-456';
      const localeData = {
        locale: 'fr',
        timezone: 'Europe/Paris',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(null);
      mockLocalePreferenceRepository.create.mockReturnValue({
        userId,
        ...localeData,
      });
      mockLocalePreferenceRepository.save.mockResolvedValue({
        id: '2',
        userId,
        ...localeData,
      });

      const result = await service.updateUserLocale(userId, localeData);

      expect(result.locale).toBe('fr');
      expect(mockLocalePreferenceRepository.create).toHaveBeenCalled();
    });

    it('should validate timezone', async () => {
      const userId = 'user-123';
      const localeData = {
        timezone: 'Invalid/Timezone',
      };

      await expect(service.updateUserLocale(userId, localeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate locale code', async () => {
      const userId = 'user-123';
      const localeData = {
        locale: 'invalid-locale',
      };

      await expect(service.updateUserLocale(userId, localeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate currency code', async () => {
      const userId = 'user-123';
      const localeData = {
        currency: 'INVALID',
      };

      await expect(service.updateUserLocale(userId, localeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update only provided fields', async () => {
      const userId = 'user-123';
      const localeData = {
        locale: 'de',
      };

      const existingPreference = {
        id: '1',
        userId,
        locale: 'en',
        timezone: 'UTC',
        currency: 'USD',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(existingPreference);
      mockLocalePreferenceRepository.save.mockResolvedValue({
        ...existingPreference,
        locale: 'de',
      });

      const result = await service.updateUserLocale(userId, localeData);

      expect(result.locale).toBe('de');
      expect(result.timezone).toBe('UTC'); // Should remain unchanged
      expect(result.currency).toBe('USD'); // Should remain unchanged
    });

    it('should handle date format preference', async () => {
      const userId = 'user-123';
      const localeData = {
        dateFormat: 'DD/MM/YYYY',
      };

      const existingPreference = {
        id: '1',
        userId,
        locale: 'en',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(existingPreference);
      mockLocalePreferenceRepository.save.mockResolvedValue({
        ...existingPreference,
        dateFormat: 'DD/MM/YYYY',
      });

      const result = await service.updateUserLocale(userId, localeData);

      expect(result.dateFormat).toBe('DD/MM/YYYY');
    });

    it('should handle time format preference', async () => {
      const userId = 'user-123';
      const localeData = {
        timeFormat: '24h',
      };

      const existingPreference = {
        id: '1',
        userId,
        locale: 'en',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(existingPreference);
      mockLocalePreferenceRepository.save.mockResolvedValue({
        ...existingPreference,
        timeFormat: '24h',
      });

      const result = await service.updateUserLocale(userId, localeData);

      expect(result.timeFormat).toBe('24h');
    });
  });

  describe('getTimezones', () => {
    it('should return list of timezones', async () => {
      const result = await service.getTimezones();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include timezone value, label, and offset', async () => {
      const result = await service.getTimezones();

      result.forEach(tz => {
        expect(tz).toHaveProperty('value');
        expect(tz).toHaveProperty('label');
        expect(tz).toHaveProperty('offset');
      });
    });

    it('should filter timezones by region', async () => {
      const result = await service.getTimezones('America');

      result.forEach(tz => {
        expect(tz.value).toContain('America/');
      });
    });

    it('should include common timezones', async () => {
      const result = await service.getTimezones();

      const commonTimezones = [
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
      ];

      commonTimezones.forEach(tzValue => {
        const found = result.find(tz => tz.value === tzValue);
        expect(found).toBeDefined();
      });
    });

    it('should sort timezones alphabetically', async () => {
      const result = await service.getTimezones();

      const labels = result.map(tz => tz.label);
      const sortedLabels = [...labels].sort();

      expect(labels).toEqual(sortedLabels);
    });

    it('should cache timezone list', async () => {
      const firstCall = await service.getTimezones();
      const secondCall = await service.getTimezones();

      expect(firstCall).toEqual(secondCall);
    });
  });

  describe('getUserLocalePreferences', () => {
    it('should return user locale preferences', async () => {
      const userId = 'user-123';
      const mockPreference = {
        id: '1',
        userId,
        locale: 'en',
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      };

      mockLocalePreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.getUserLocalePreferences(userId);

      expect(result).toEqual(mockPreference);
    });

    it('should return default preferences for new user', async () => {
      const userId = 'user-456';

      mockLocalePreferenceRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserLocalePreferences(userId);

      expect(result.locale).toBe('en');
      expect(result.timezone).toBe('UTC');
      expect(result.currency).toBe('USD');
    });

    it('should handle missing user', async () => {
      const userId = 'non-existent';

      mockLocalePreferenceRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserLocalePreferences(userId);

      // Should return defaults instead of throwing error
      expect(result).toBeDefined();
      expect(result.locale).toBe('en');
    });
  });

  describe('formatDate', () => {
    it('should format date according to locale', async () => {
      const date = new Date('2025-01-15');

      const enFormat = await service.formatDate(date, 'en');
      const esFormat = await service.formatDate(date, 'es');

      expect(enFormat).toBeDefined();
      expect(esFormat).toBeDefined();
      expect(typeof enFormat).toBe('string');
      expect(typeof esFormat).toBe('string');
    });

    it('should apply custom date format', async () => {
      const date = new Date('2025-01-15');
      const format = 'DD/MM/YYYY';

      const result = await service.formatDate(date, 'en', format);

      expect(result).toContain('15');
      expect(result).toContain('01');
      expect(result).toContain('2025');
    });

    it('should handle timezone in date formatting', async () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const timezone = 'America/New_York';

      const result = await service.formatDate(date, 'en', undefined, timezone);

      expect(result).toBeDefined();
    });
  });

  describe('formatNumber', () => {
    it('should format number according to locale', async () => {
      const number = 1234567.89;

      const enFormat = await service.formatNumber(number, 'en');
      const deFormat = await service.formatNumber(number, 'de');

      expect(enFormat).toBeDefined();
      expect(deFormat).toBeDefined();
      expect(typeof enFormat).toBe('string');
      expect(typeof deFormat).toBe('string');
    });

    it('should handle decimal places', async () => {
      const number = 1234.567;

      const result = await service.formatNumber(number, 'en', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      expect(result).toContain('.57');
    });

    it('should format as currency', async () => {
      const amount = 1234.56;

      const result = await service.formatNumber(amount, 'en', {
        style: 'currency',
        currency: 'USD',
      });

      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', async () => {
      const userId = 'user-123';
      const localeData1 = { locale: 'es' };
      const localeData2 = { locale: 'fr' };

      mockLocalePreferenceRepository.findOne.mockResolvedValue({
        id: '1',
        userId,
        locale: 'en',
      });
      mockLocalePreferenceRepository.save.mockResolvedValue({
        id: '1',
        userId,
        locale: 'fr',
      });

      const promises = [
        service.updateUserLocale(userId, localeData1),
        service.updateUserLocale(userId, localeData2),
      ];

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle special characters in translations', async () => {
      const result = await service.getTranslations('en');

      // Should handle special characters without errors
      expect(result).toBeDefined();
    });
  });
});
