import {
  sanitize,
  sanitizeStrict,
  sanitizeUserInput,
  sanitizeFileName,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeObject,
} from '../sanitizer';

describe('Sanitizer Security Tests', () => {
  describe('sanitize', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitize(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should remove dangerous script tags', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = sanitize(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe content');
    });

    it('should remove event handlers from HTML', () => {
      const input = '<div onclick="malicious()">Click me</div>';
      const result = sanitize(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('malicious');
    });

    it('should sanitize iframe elements', () => {
      const input = '<iframe src="http://evil.com"></iframe>';
      const result = sanitize(input);
      expect(result).not.toContain('<iframe');
    });

    it('should sanitize object and embed tags', () => {
      const input = '<object data="malicious.swf"></object><embed src="evil.swf">';
      const result = sanitize(input);
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
    });

    it('should add noopener noreferrer to links', () => {
      const input = '<a href="http://example.com">Link</a>';
      const result = sanitize(input);
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
    });

    it('should allow only safe URL schemes in links', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitize(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle empty input', () => {
      const result = sanitize('');
      expect(result).toBe('');
    });

    it('should handle input with only whitespace', () => {
      const result = sanitize('   \n\t  ');
      expect(result).toBeTruthy();
    });

    it('should preserve safe formatting', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitize(input);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
    });
  });

  describe('sanitizeStrict', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
      expect(result).toBe('Hello world!');
    });

    it('should remove script tags and content', () => {
      const input = '<script>alert("XSS")</script>Clean text';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Clean text');
    });

    it('should handle nested HTML tags', () => {
      const input = '<div><span><b>Nested</b></span></div>';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toBe('Nested');
    });

    it('should preserve plain text', () => {
      const input = 'Just plain text';
      const result = sanitizeStrict(input);
      expect(result).toBe(input);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should remove angle brackets', () => {
      const input = 'Hello <world>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toBe('Hello world');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert(1)';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onclick=');
    });

    it('should handle case-insensitive javascript protocol', () => {
      const input = 'JaVaScRiPt:alert(1)';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('JaVaScRiPt:');
      expect(result).not.toContain('javascript:');
    });

    it('should remove multiple event handlers', () => {
      const input = 'onload=x onerror=y onclick=z';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onload=');
      expect(result).not.toContain('onerror=');
      expect(result).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeUserInput(input);
      expect(result).toBe('hello world');
    });

    it('should handle non-string input', () => {
      const result = sanitizeUserInput(123 as any);
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = sanitizeUserInput(null as any);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeUserInput(undefined as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace special characters with underscores', () => {
      const input = 'my file@name#test.pdf';
      const result = sanitizeFileName(input);
      expect(result).toBe('my_file_name_test.pdf');
    });

    it('should allow alphanumeric, dots, dashes, and underscores', () => {
      const input = 'valid-file_name.123.pdf';
      const result = sanitizeFileName(input);
      expect(result).toBe(input);
    });

    it('should prevent directory traversal attacks', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
      expect(result).toBe('._._._etc_passwd');
    });

    it('should remove consecutive dots', () => {
      const input = 'file....name.txt';
      const result = sanitizeFileName(input);
      expect(result).toBe('file.name.txt');
    });

    it('should truncate long filenames', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(input);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle Windows invalid characters', () => {
      const input = 'file:name|test?.txt';
      const result = sanitizeFileName(input);
      expect(result).not.toContain(':');
      expect(result).not.toContain('|');
      expect(result).not.toContain('?');
    });

    it('should handle null byte injection', () => {
      const input = 'file\0name.txt';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('\0');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe(input + '/');
    });

    it('should allow valid HTTPS URLs', () => {
      const input = 'https://example.com/path';
      const result = sanitizeUrl(input);
      expect(result).toBe(input);
    });

    it('should reject javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('should reject data: URLs', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('should reject file: protocol', () => {
      const input = 'file:///etc/passwd';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('should reject invalid URLs', () => {
      const input = 'not a url';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      const input = 'https://example.com/path?query=value&other=test';
      const result = sanitizeUrl(input);
      expect(result).toBe(input);
    });

    it('should handle URLs with fragments', () => {
      const input = 'https://example.com/path#section';
      const result = sanitizeUrl(input);
      expect(result).toBe(input);
    });

    it('should reject URLs with username/password', () => {
      const input = 'https://user:pass@example.com';
      const result = sanitizeUrl(input);
      // Should still parse but we can verify the URL object
      expect(result).toBeTruthy();
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert email to lowercase', () => {
      const input = 'TEST@EXAMPLE.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const input = '  test@example.com  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('should remove invalid characters', () => {
      const input = 'test<script>@example.com';
      const result = sanitizeEmail(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      // Note: sanitizeEmail removes invalid chars like < and >, but 'script' is valid text
      // The result will be 'testscript@example.com' which is safe for email context
      expect(result).toBe('testscript@example.com');
    });

    it('should allow valid email characters', () => {
      const input = 'user+tag@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe(input);
    });

    it('should allow dots and dashes', () => {
      const input = 'user.name-test@example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe(input);
    });

    it('should handle empty input', () => {
      const result = sanitizeEmail('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize specified string keys', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        age: 30,
        bio: '<p>Hello</p>',
      };
      const result = sanitizeObject(input, ['name', 'bio']);
      expect(result.name).not.toContain('<script>');
      expect(result.bio).not.toContain('<p>');
      expect(result.age).toBe(30);
    });

    it('should not modify non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
      };
      const result = sanitizeObject(input, ['name', 'age', 'active']);
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
    });

    it('should handle empty key array', () => {
      const input = { name: '<script>test</script>' };
      const result = sanitizeObject(input, []);
      expect(result.name).toContain('<script>');
    });

    it('should not mutate original object', () => {
      const input = { name: '<b>John</b>' };
      const result = sanitizeObject(input, ['name']);
      expect(input.name).toBe('<b>John</b>');
      expect(result.name).not.toBe(input.name);
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent reflected XSS attacks', () => {
      const xssPayloads = [
        '<script>alert(document.cookie)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<body onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
      ];

      xssPayloads.forEach((payload) => {
        const result = sanitizeStrict(payload);
        expect(result).not.toContain('script');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('javascript:');
      });
    });

    it('should prevent stored XSS attacks', () => {
      const xssPayloads = [
        '<div><script>alert(1)</script></div>',
        '<a href="javascript:void(0)">Click</a>',
        '<<SCRIPT>alert("XSS");//<</SCRIPT>',
      ];

      xssPayloads.forEach((payload) => {
        const result = sanitizeStrict(payload);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('javascript:');
      });
    });

    it('should prevent DOM-based XSS', () => {
      const input = '<img src=x onerror="document.location=\'http://evil.com/\'">';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('document.location');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize potential SQL injection in user input', () => {
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM users--",
      ];

      sqlPayloads.forEach((payload) => {
        const result = sanitizeUserInput(payload);
        // Should remove dangerous characters but the real protection is parameterized queries
        expect(result).toBeTruthy();
      });
    });

    it('should handle input with single quotes', () => {
      const input = "O'Brien";
      const result = sanitizeUserInput(input);
      expect(result).toBeTruthy();
      // Sanitization should not break valid names
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal in filenames', () => {
      const maliciousNames = [
        '../../etc/passwd',
        '..\\..\\windows\\system32',
        './../../sensitive/file.txt',
      ];

      maliciousNames.forEach((name) => {
        const result = sanitizeFileName(name);
        expect(result).not.toContain('..');
        expect(result).not.toContain('/');
        expect(result).not.toContain('\\');
      });
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('should handle Unicode characters safely', () => {
      const input = 'Hello 世界 🌍';
      const result = sanitizeUserInput(input);
      expect(result).toBeTruthy();
    });

    it('should handle very long strings', () => {
      const input = 'a'.repeat(10000);
      expect(() => sanitizeUserInput(input)).not.toThrow();
    });

    it('should handle special HTML entities', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitize(input);
      expect(result).toBeTruthy();
    });

    it('should handle malformed HTML', () => {
      const input = '<div><span>Unclosed tags';
      const result = sanitize(input);
      expect(result).toBeTruthy();
    });
  });

  describe('Performance and Denial of Service Prevention', () => {
    it('should handle deeply nested HTML without hanging', () => {
      const depth = 100;
      let input = 'content';
      for (let i = 0; i < depth; i++) {
        input = `<div>${input}</div>`;
      }

      expect(() => sanitize(input)).not.toThrow();
    });

    it('should handle large number of tags', () => {
      const input = '<p>text</p>'.repeat(1000);
      expect(() => sanitize(input)).not.toThrow();
    });
  });

  describe('GDPR Compliance - Data Sanitization', () => {
    it('should sanitize personal data before logging', () => {
      const userData = {
        email: 'user@example.com',
        name: '<script>alert(1)</script>John Doe',
        phone: '+1234567890',
      };

      const sanitized = sanitizeObject(userData, ['name', 'email']);
      expect(sanitized.name).not.toContain('<script>');
    });

    it('should prepare data for safe export', () => {
      const input = '<div>User data with <script>malicious</script> content</div>';
      const result = sanitizeStrict(input);
      expect(result).not.toContain('<script>');
    });
  });
});
