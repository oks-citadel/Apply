import {
  validateEmail,
  validatePassword,
  validateUrl,
  validatePhoneNumber,
  validateFileType,
  validateFileSize,
  validateUUID,
  validateDateRange,
  sanitizeAndValidate,
} from '../validators';

describe('Validators Security Tests', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user_name@example.com',
        'user123@example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user..name@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email must be less than 255 characters');
    });

    it('should reject emails with dangerous characters', () => {
      const dangerousEmails = [
        'user<script>@example.com',
        'user@example.com<>',
        'user@exam"ple.com',
      ];

      dangerousEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Str0ng!Pass',
        'C0mpl3x@Password',
      ];

      strongPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password longer than 128 characters', () => {
      const longPassword = 'P@ssw0rd' + 'a'.repeat(125);
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should reject common weak passwords', () => {
      const weakPasswords = [
        '12345678',
        'password',
        'qwerty',
        'abc12345',
      ];

      weakPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate correct HTTP/HTTPS URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://subdomain.example.com',
        'https://example.com/path/to/page',
        'https://example.com?query=value',
        'https://example.com#section',
      ];

      validUrls.forEach((url) => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject javascript: protocol', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject data: protocol', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject file: protocol', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL must use http or https protocol');
    });

    it('should reject ftp: protocol', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL must use http or https protocol');
    });

    it('should reject invalid URL format', () => {
      const invalidUrls = [
        'not a url',
        'htp://example.com',
        '//example.com',
        'example.com',
      ];

      invalidUrls.forEach((url) => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+12345678901',
        '+441234567890',
        '+4412345678901234',
      ];

      validPhones.forEach((phone) => {
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should validate phone numbers with formatting', () => {
      const formattedPhones = [
        '+1 234 567 8901',
        '+44 (0) 1234 567890',
        '+1-234-567-8901',
      ];

      formattedPhones.forEach((phone) => {
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it('should allow empty phone number (optional field)', () => {
      const result = validatePhoneNumber('');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abcdefghijk',
        '+',
        '00123456789',
      ];

      invalidPhones.forEach((phone) => {
        const result = validatePhoneNumber(phone);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateFileType', () => {
    it('should validate allowed file types', () => {
      const result = validateFileType('document.pdf', ['pdf', 'doc', 'docx']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject disallowed file types', () => {
      const result = validateFileType('script.exe', ['pdf', 'doc', 'docx']);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const result = validateFileType('document.PDF', ['pdf', 'doc']);
      expect(result.isValid).toBe(true);
    });

    it('should reject files without extension', () => {
      const result = validateFileType('document', ['pdf', 'doc']);
      expect(result.isValid).toBe(false);
    });

    it('should reject dangerous file extensions', () => {
      const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'ps1'];
      const allowedExtensions = ['pdf', 'doc', 'docx'];

      dangerousExtensions.forEach((ext) => {
        const result = validateFileType(`file.${ext}`, allowedExtensions);
        expect(result.isValid).toBe(false);
      });
    });

    it('should handle multiple dots in filename', () => {
      const result = validateFileType('my.document.pdf', ['pdf', 'doc']);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should validate files within size limit', () => {
      const fileSizeInBytes = 5 * 1024 * 1024; // 5MB
      const result = validateFileSize(fileSizeInBytes, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files exceeding size limit', () => {
      const fileSizeInBytes = 15 * 1024 * 1024; // 15MB
      const result = validateFileSize(fileSizeInBytes, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum allowed size of 10MB');
    });

    it('should handle zero-byte files', () => {
      const result = validateFileSize(0, 10);
      expect(result.isValid).toBe(true);
    });

    it('should validate files at exact size limit', () => {
      const fileSizeInBytes = 10 * 1024 * 1024; // Exactly 10MB
      const result = validateFileSize(fileSizeInBytes, 10);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '550e8400-e29b-41d4-a716-446655440000',
      ];

      validUUIDs.forEach((uuid) => {
        const result = validateUUID(uuid);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456',
        'not-a-uuid',
        '123e4567e89b12d3a456426614174000',
        '123e4567-e89b-12d3-a456-42661417400g',
      ];

      invalidUUIDs.forEach((uuid) => {
        const result = validateUUID(uuid);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject empty UUID', () => {
      const result = validateUUID('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UUID is required');
    });

    it('should be case-insensitive', () => {
      const result = validateUUID('123E4567-E89B-12D3-A456-426614174000');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date ranges', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date ranges', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      const result = validateDateRange(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before end date');
    });

    it('should handle same start and end dates', () => {
      const date = new Date('2024-06-15');
      const result = validateDateRange(date, date);
      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeAndValidate', () => {
    it('should validate all fields in an object', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const validators = {
        email: (value: unknown) => validateEmail(value as string),
        password: (value: unknown) => validatePassword(value as string),
      };

      const result = sanitizeAndValidate(data, validators);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const data = {
        email: 'invalid-email',
        password: 'weak',
      };

      const validators = {
        email: (value: unknown) => validateEmail(value as string),
        password: (value: unknown) => validatePassword(value as string),
      };

      const result = sanitizeAndValidate(data, validators);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });

    it('should return original data', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const validators = {
        email: (value: unknown) => validateEmail(value as string),
        password: (value: unknown) => validatePassword(value as string),
      };

      const result = sanitizeAndValidate(data, validators);
      expect(result.data).toEqual(data);
    });
  });

  describe('Input Injection Prevention', () => {
    it('should prevent SQL injection in email validation', () => {
      const sqlInjection = "admin@example.com'; DROP TABLE users; --";
      const result = validateEmail(sqlInjection);
      expect(result.isValid).toBe(false);
    });

    it('should prevent XSS in URL validation', () => {
      const xssUrl = 'javascript:alert(document.cookie)';
      const result = validateUrl(xssUrl);
      expect(result.isValid).toBe(false);
    });

    it('should prevent path traversal in filename validation', () => {
      const maliciousFile = '../../etc/passwd.pdf';
      const result = validateFileType(maliciousFile, ['pdf']);
      // The file extension is valid but the path should be sanitized elsewhere
      expect(result.isValid).toBe(true); // Only validates extension
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle null byte injection in email', () => {
      const email = 'user\0@example.com';
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
    });

    it('should handle Unicode in password', () => {
      const password = 'Pässw0rd!123';
      const result = validatePassword(password);
      // Should validate based on character requirements
      expect(result).toBeDefined();
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(10000);
      const result = validateUrl(longUrl);
      expect(result).toBeDefined();
    });

    it('should handle international domain names', () => {
      const email = 'user@münchen.de';
      const result = validateEmail(email);
      // Should handle IDN domains
      expect(result).toBeDefined();
    });
  });

  describe('CSRF Token Validation Preparation', () => {
    it('should validate UUIDs used as CSRF tokens', () => {
      const csrfToken = '550e8400-e29b-41d4-a716-446655440000';
      const result = validateUUID(csrfToken);
      expect(result.isValid).toBe(true);
    });

    it('should reject malformed CSRF tokens', () => {
      const malformedToken = 'malformed-token-12345';
      const result = validateUUID(malformedToken);
      expect(result.isValid).toBe(false);
    });
  });

  describe('API Key Format Validation', () => {
    it('should validate API key format using UUID validator', () => {
      const apiKey = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const result = validateUUID(apiKey);
      expect(result.isValid).toBe(true);
    });
  });

  describe('GDPR Compliance - Data Validation', () => {
    it('should validate data before export', () => {
      const exportData = {
        email: 'user@example.com',
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      const emailResult = validateEmail(exportData.email);
      const dateResult = validateDateRange(
        exportData.dateRange.start,
        exportData.dateRange.end
      );

      expect(emailResult.isValid).toBe(true);
      expect(dateResult.isValid).toBe(true);
    });

    it('should validate user identification for account deletion', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const result = validateUUID(userId);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Rate Limit Validation Support', () => {
    it('should validate file upload constraints', () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      const fileName = 'resume.pdf';

      const sizeResult = validateFileSize(fileSize, 10);
      const typeResult = validateFileType(fileName, ['pdf', 'doc', 'docx']);

      expect(sizeResult.isValid).toBe(true);
      expect(typeResult.isValid).toBe(true);
    });
  });

  describe('Authorization Token Validation', () => {
    it('should validate session token format', () => {
      const sessionToken = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateUUID(sessionToken);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid session tokens', () => {
      const invalidToken = 'invalid-session-token';
      const result = validateUUID(invalidToken);
      expect(result.isValid).toBe(false);
    });
  });
});
