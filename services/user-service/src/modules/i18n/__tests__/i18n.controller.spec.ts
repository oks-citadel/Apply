import { Test, TestingModule } from '@nestjs/testing';
import { I18nController } from '../i18n.controller';
import { I18nService } from '../i18n.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('I18nController', () => {
  let controller: I18nController;
  let service: I18nService;

  const mockI18nService = {
    getAvailableLanguages: jest.fn(),
    getTranslations: jest.fn(),
    convertCurrency: jest.fn(),
    updateUserLocale: jest.fn(),
    getTimezones: jest.fn(),
    getUserLocalePreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [I18nController],
      providers: [
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    controller = module.get<I18nController>(I18nController);
    service = module.get<I18nService>(I18nService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableLanguages', () => {
    it('should return list of available languages', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
        { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
      ];

      mockI18nService.getAvailableLanguages.mockResolvedValue(mockLanguages);

      const result = await controller.getAvailableLanguages();

      expect(result).toEqual(mockLanguages);
      expect(service.getAvailableLanguages).toHaveBeenCalledTimes(1);
    });

    it('should include RTL language information', async () => {
      const mockLanguages = [
        { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
      ];

      mockI18nService.getAvailableLanguages.mockResolvedValue(mockLanguages);

      const result = await controller.getAvailableLanguages();

      const rtlLanguages = result.filter(lang => lang.direction === 'rtl');
      expect(rtlLanguages).toHaveLength(2);
      expect(rtlLanguages.map(l => l.code)).toEqual(['ar', 'he']);
    });

    it('should handle empty language list', async () => {
      mockI18nService.getAvailableLanguages.mockResolvedValue([]);

      const result = await controller.getAvailableLanguages();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTranslations', () => {
    it('should return translations for valid locale', async () => {
      const locale = 'en';
      const mockTranslations = {
        common: {
          welcome: 'Welcome',
          hello: 'Hello',
          goodbye: 'Goodbye',
        },
        jobs: {
          title: 'Jobs',
          search: 'Search jobs',
          apply: 'Apply now',
        },
      };

      mockI18nService.getTranslations.mockResolvedValue(mockTranslations);

      const result = await controller.getTranslations(locale);

      expect(result).toEqual(mockTranslations);
      expect(service.getTranslations).toHaveBeenCalledWith(locale);
    });

    it('should return translations for Spanish locale', async () => {
      const locale = 'es';
      const mockTranslations = {
        common: {
          welcome: 'Bienvenido',
          hello: 'Hola',
          goodbye: 'Adiós',
        },
        jobs: {
          title: 'Trabajos',
          search: 'Buscar trabajos',
          apply: 'Aplicar ahora',
        },
      };

      mockI18nService.getTranslations.mockResolvedValue(mockTranslations);

      const result = await controller.getTranslations(locale);

      expect(result).toEqual(mockTranslations);
      expect(service.getTranslations).toHaveBeenCalledWith(locale);
    });

    it('should throw NotFoundException for unsupported locale', async () => {
      const locale = 'xx';
      mockI18nService.getTranslations.mockRejectedValue(
        new NotFoundException(`Locale '${locale}' not found`),
      );

      await expect(controller.getTranslations(locale)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle nested translation keys', async () => {
      const locale = 'en';
      const mockTranslations = {
        dashboard: {
          stats: {
            applications: 'Applications',
            interviews: 'Interviews',
          },
        },
      };

      mockI18nService.getTranslations.mockResolvedValue(mockTranslations);

      const result = await controller.getTranslations(locale);

      expect(result.dashboard.stats.applications).toBe('Applications');
    });

    it('should validate locale format', async () => {
      const invalidLocale = 'en_US_INVALID';
      mockI18nService.getTranslations.mockRejectedValue(
        new BadRequestException('Invalid locale format'),
      );

      await expect(controller.getTranslations(invalidLocale)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('convertCurrency', () => {
    it('should convert USD to EUR', async () => {
      const params = {
        amount: 100,
        from: 'USD',
        to: 'EUR',
      };

      const mockResult = {
        amount: 100,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 92.5,
        rate: 0.925,
        timestamp: new Date(),
      };

      mockI18nService.convertCurrency.mockResolvedValue(mockResult);

      const result = await controller.convertCurrency(params);

      expect(result).toEqual(mockResult);
      expect(service.convertCurrency).toHaveBeenCalledWith(params);
    });

    it('should handle multiple currency conversions', async () => {
      const conversions = [
        { amount: 100, from: 'USD', to: 'EUR' },
        { amount: 100, from: 'USD', to: 'GBP' },
        { amount: 100, from: 'USD', to: 'JPY' },
      ];

      for (const params of conversions) {
        const mockResult = {
          ...params,
          convertedAmount: 100 * 0.9,
          rate: 0.9,
          timestamp: new Date(),
        };

        mockI18nService.convertCurrency.mockResolvedValue(mockResult);
        const result = await controller.convertCurrency(params);
        expect(result.from).toBe(params.from);
        expect(result.to).toBe(params.to);
      }
    });

    it('should validate currency codes', async () => {
      const params = {
        amount: 100,
        from: 'INVALID',
        to: 'EUR',
      };

      mockI18nService.convertCurrency.mockRejectedValue(
        new BadRequestException('Invalid currency code'),
      );

      await expect(controller.convertCurrency(params)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle zero amount', async () => {
      const params = {
        amount: 0,
        from: 'USD',
        to: 'EUR',
      };

      const mockResult = {
        ...params,
        convertedAmount: 0,
        rate: 0.925,
        timestamp: new Date(),
      };

      mockI18nService.convertCurrency.mockResolvedValue(mockResult);

      const result = await controller.convertCurrency(params);

      expect(result.convertedAmount).toBe(0);
    });

    it('should handle negative amounts', async () => {
      const params = {
        amount: -100,
        from: 'USD',
        to: 'EUR',
      };

      mockI18nService.convertCurrency.mockRejectedValue(
        new BadRequestException('Amount must be positive'),
      );

      await expect(controller.convertCurrency(params)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include conversion rate in response', async () => {
      const params = {
        amount: 100,
        from: 'USD',
        to: 'EUR',
      };

      const mockResult = {
        ...params,
        convertedAmount: 92.5,
        rate: 0.925,
        timestamp: new Date(),
      };

      mockI18nService.convertCurrency.mockResolvedValue(mockResult);

      const result = await controller.convertCurrency(params);

      expect(result.rate).toBeDefined();
      expect(typeof result.rate).toBe('number');
    });
  });

  describe('updateUserLocale', () => {
    it('should update user locale preferences', async () => {
      const userId = 'user-123';
      const localeData = {
        locale: 'es',
        timezone: 'Europe/Madrid',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      };

      const mockResult = {
        userId,
        ...localeData,
        updatedAt: new Date(),
      };

      mockI18nService.updateUserLocale.mockResolvedValue(mockResult);

      const result = await controller.updateUserLocale(userId, localeData);

      expect(result).toEqual(mockResult);
      expect(service.updateUserLocale).toHaveBeenCalledWith(userId, localeData);
    });

    it('should handle timezone change', async () => {
      const userId = 'user-123';
      const localeData = {
        timezone: 'America/New_York',
      };

      const mockResult = {
        userId,
        timezone: 'America/New_York',
        updatedAt: new Date(),
      };

      mockI18nService.updateUserLocale.mockResolvedValue(mockResult);

      const result = await controller.updateUserLocale(userId, localeData);

      expect(result.timezone).toBe('America/New_York');
    });

    it('should validate timezone format', async () => {
      const userId = 'user-123';
      const localeData = {
        timezone: 'Invalid/Timezone',
      };

      mockI18nService.updateUserLocale.mockRejectedValue(
        new BadRequestException('Invalid timezone'),
      );

      await expect(
        controller.updateUserLocale(userId, localeData),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update currency preference', async () => {
      const userId = 'user-123';
      const localeData = {
        currency: 'GBP',
      };

      const mockResult = {
        userId,
        currency: 'GBP',
        updatedAt: new Date(),
      };

      mockI18nService.updateUserLocale.mockResolvedValue(mockResult);

      const result = await controller.updateUserLocale(userId, localeData);

      expect(result.currency).toBe('GBP');
    });

    it('should update date format preference', async () => {
      const userId = 'user-123';
      const localeData = {
        dateFormat: 'MM/DD/YYYY',
      };

      const mockResult = {
        userId,
        dateFormat: 'MM/DD/YYYY',
        updatedAt: new Date(),
      };

      mockI18nService.updateUserLocale.mockResolvedValue(mockResult);

      const result = await controller.updateUserLocale(userId, localeData);

      expect(result.dateFormat).toBe('MM/DD/YYYY');
    });

    it('should update time format preference', async () => {
      const userId = 'user-123';
      const localeData = {
        timeFormat: '12h',
      };

      const mockResult = {
        userId,
        timeFormat: '12h',
        updatedAt: new Date(),
      };

      mockI18nService.updateUserLocale.mockResolvedValue(mockResult);

      const result = await controller.updateUserLocale(userId, localeData);

      expect(result.timeFormat).toBe('12h');
    });

    it('should handle user not found', async () => {
      const userId = 'non-existent';
      const localeData = { locale: 'en' };

      mockI18nService.updateUserLocale.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.updateUserLocale(userId, localeData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTimezones', () => {
    it('should return list of timezones', async () => {
      const mockTimezones = [
        { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
        { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
        { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
        { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: '+00:00' },
        { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: '+01:00' },
        { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: '+09:00' },
      ];

      mockI18nService.getTimezones.mockResolvedValue(mockTimezones);

      const result = await controller.getTimezones();

      expect(result).toEqual(mockTimezones);
      expect(result.length).toBeGreaterThan(0);
      expect(service.getTimezones).toHaveBeenCalledTimes(1);
    });

    it('should include timezone offset information', async () => {
      const mockTimezones = [
        { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
        { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: '+00:00' },
      ];

      mockI18nService.getTimezones.mockResolvedValue(mockTimezones);

      const result = await controller.getTimezones();

      result.forEach(tz => {
        expect(tz.offset).toBeDefined();
        expect(typeof tz.offset).toBe('string');
      });
    });

    it('should filter timezones by region', async () => {
      const region = 'America';
      const mockTimezones = [
        { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
        { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
      ];

      mockI18nService.getTimezones.mockResolvedValue(mockTimezones);

      const result = await controller.getTimezones(region);

      expect(result).toEqual(mockTimezones);
      result.forEach(tz => {
        expect(tz.value).toContain('America/');
      });
    });

    it('should handle empty timezone list', async () => {
      mockI18nService.getTimezones.mockResolvedValue([]);

      const result = await controller.getTimezones();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserLocalePreferences', () => {
    it('should return user locale preferences', async () => {
      const userId = 'user-123';
      const mockPreferences = {
        userId,
        locale: 'en',
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        updatedAt: new Date(),
      };

      mockI18nService.getUserLocalePreferences.mockResolvedValue(mockPreferences);

      const result = await controller.getUserLocalePreferences(userId);

      expect(result).toEqual(mockPreferences);
      expect(service.getUserLocalePreferences).toHaveBeenCalledWith(userId);
    });

    it('should handle user with no preferences', async () => {
      const userId = 'user-456';
      const mockDefaultPreferences = {
        userId,
        locale: 'en',
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
      };

      mockI18nService.getUserLocalePreferences.mockResolvedValue(
        mockDefaultPreferences,
      );

      const result = await controller.getUserLocalePreferences(userId);

      expect(result.locale).toBe('en');
      expect(result.timezone).toBe('UTC');
    });

    it('should throw error for invalid user', async () => {
      const userId = 'invalid-user';

      mockI18nService.getUserLocalePreferences.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserLocalePreferences(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockI18nService.getAvailableLanguages.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.getAvailableLanguages()).rejects.toThrow();
    });

    it('should propagate validation errors', async () => {
      const locale = '';
      mockI18nService.getTranslations.mockRejectedValue(
        new BadRequestException('Locale is required'),
      );

      await expect(controller.getTranslations(locale)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
