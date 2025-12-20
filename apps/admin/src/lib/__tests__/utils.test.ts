import {
  cn,
  formatDate,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncate,
  getInitials,
  sleep,
  debounce,
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
  });

  describe('formatDate', () => {
    it('formats Date object', () => {
      // Use noon UTC to avoid timezone date rollover
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date string', () => {
      // Use noon UTC to avoid timezone date rollover
      const result = formatDate('2024-06-15T12:00:00Z');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('formats date with time', () => {
      const date = new Date('2024-06-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('handles string input', () => {
      const result = formatDateTime('2024-06-15T14:30:00');
      expect(result).toBeTruthy();
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

    it('handles negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
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

  describe('formatPercentage', () => {
    it('formats with default decimals', () => {
      expect(formatPercentage(12.345)).toBe('12.3%');
    });

    it('formats with custom decimals', () => {
      expect(formatPercentage(12.345, 2)).toBe('12.35%');
    });

    it('handles whole numbers', () => {
      expect(formatPercentage(50)).toBe('50.0%');
    });

    it('handles negative numbers', () => {
      expect(formatPercentage(-5.5)).toBe('-5.5%');
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

  describe('sleep', () => {
    it('returns a promise', () => {
      const result = sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves after specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('only calls once for multiple rapid calls', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to the function', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
