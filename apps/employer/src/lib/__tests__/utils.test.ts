import {
  cn,
  formatDate,
  formatCurrency,
  formatNumber,
  truncate,
  getInitials,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('merges tailwind classes correctly', () => {
      // tailwind-merge should handle conflicting classes
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  describe('formatDate', () => {
    it('formats Date object', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date string', () => {
      const result = formatDate('2024-06-15');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with dollar sign', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('$');
      expect(result).toContain('1,234');
    });

    it('handles whole numbers', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('$');
      expect(result).toContain('1,000');
    });

    it('handles zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('$');
      expect(result).toContain('0');
    });
  });

  describe('formatNumber', () => {
    it('formats number with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('handles small numbers', () => {
      expect(formatNumber(123)).toBe('123');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('returns original if short enough', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('handles exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('handles empty string', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('getInitials', () => {
    it('gets initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('gets initials from single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('limits to 2 characters', () => {
      expect(getInitials('John James Doe')).toBe('JJ');
    });

    it('handles lowercase', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });
});
