import { emailRegex, validators, sanitizeInput, validateForm } from '../validation';

describe('validation utilities', () => {
  describe('emailRegex', () => {
    it('matches valid email addresses', () => {
      expect(emailRegex.test('user@example.com')).toBe(true);
      expect(emailRegex.test('user.name@example.co.uk')).toBe(true);
      expect(emailRegex.test('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(emailRegex.test('invalid')).toBe(false);
      expect(emailRegex.test('invalid@')).toBe(false);
      expect(emailRegex.test('@example.com')).toBe(false);
      expect(emailRegex.test('user @example.com')).toBe(false);
    });
  });

  describe('validators.email', () => {
    it('returns undefined for valid email', () => {
      expect(validators.email('user@example.com')).toBeUndefined();
    });

    it('returns error for empty email', () => {
      expect(validators.email('')).toBe('Email is required');
    });

    it('returns error for invalid email format', () => {
      expect(validators.email('invalid')).toBe('Invalid email format');
    });
  });

  describe('validators.password', () => {
    it('returns undefined for valid password', () => {
      expect(validators.password('validpass')).toBeUndefined();
      expect(validators.password('12345678')).toBeUndefined();
    });

    it('returns error for empty password', () => {
      expect(validators.password('')).toBe('Password is required');
    });

    it('returns error for short password', () => {
      expect(validators.password('short')).toBe('Password must be at least 8 characters');
    });

    it('uses custom minimum length', () => {
      expect(validators.password('valid', 5)).toBeUndefined();
      expect(validators.password('hi', 5)).toBe('Password must be at least 5 characters');
    });
  });

  describe('validators.confirmPassword', () => {
    it('returns undefined when passwords match', () => {
      expect(validators.confirmPassword('password123', 'password123')).toBeUndefined();
    });

    it('returns error when confirmPassword is empty', () => {
      expect(validators.confirmPassword('password123', '')).toBe(
        'Please confirm your password'
      );
    });

    it('returns error when passwords do not match', () => {
      expect(validators.confirmPassword('password123', 'password456')).toBe(
        'Passwords do not match'
      );
    });
  });

  describe('validators.required', () => {
    it('returns undefined for non-empty value', () => {
      expect(validators.required('value', 'Field')).toBeUndefined();
    });

    it('returns error for empty string', () => {
      expect(validators.required('', 'Field')).toBe('Field is required');
    });

    it('returns error for whitespace-only string', () => {
      expect(validators.required('   ', 'Field')).toBe('Field is required');
    });
  });

  describe('validators.minLength', () => {
    it('returns undefined for valid length', () => {
      expect(validators.minLength('hello', 3, 'Field')).toBeUndefined();
      expect(validators.minLength('hello', 5, 'Field')).toBeUndefined();
    });

    it('returns error for short value', () => {
      expect(validators.minLength('hi', 5, 'Field')).toBe(
        'Field must be at least 5 characters'
      );
    });
  });

  describe('validators.maxLength', () => {
    it('returns undefined for valid length', () => {
      expect(validators.maxLength('hi', 5, 'Field')).toBeUndefined();
      expect(validators.maxLength('hello', 5, 'Field')).toBeUndefined();
    });

    it('returns error for long value', () => {
      expect(validators.maxLength('hello world', 5, 'Field')).toBe(
        'Field must be at most 5 characters'
      );
    });
  });

  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('collapses multiple spaces', () => {
      expect(sanitizeInput('hello   world')).toBe('hello world');
    });

    it('handles both trim and collapse', () => {
      expect(sanitizeInput('  hello   world  ')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('validateForm', () => {
    it('returns empty object when no errors', () => {
      const data = {
        email: 'user@example.com',
        name: 'John',
      };
      const rules = {
        email: [(val: string) => validators.email(val)],
        name: [(val: string) => validators.required(val, 'Name')],
      };

      expect(validateForm(data, rules)).toEqual({});
    });

    it('returns errors for invalid fields', () => {
      const data = {
        email: 'invalid',
        name: '',
      };
      const rules = {
        email: [(val: string) => validators.email(val)],
        name: [(val: string) => validators.required(val, 'Name')],
      };

      const errors = validateForm(data, rules);
      expect(errors.email).toBe('Invalid email format');
      expect(errors.name).toBe('Name is required');
    });

    it('stops at first error for each field', () => {
      const data = {
        name: '',
      };
      const rules = {
        name: [
          (val: string) => validators.required(val, 'Name'),
          (val: string) => validators.minLength(val, 5, 'Name'),
        ],
      };

      const errors = validateForm(data, rules);
      expect(errors.name).toBe('Name is required');
    });

    it('validates all fields', () => {
      const data = {
        email: '',
        password: '123',
        name: '',
      };
      const rules = {
        email: [(val: string) => validators.email(val)],
        password: [(val: string) => validators.password(val)],
        name: [(val: string) => validators.required(val, 'Name')],
      };

      const errors = validateForm(data, rules);
      expect(Object.keys(errors)).toHaveLength(3);
    });
  });
});
