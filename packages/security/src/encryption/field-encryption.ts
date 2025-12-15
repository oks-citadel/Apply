/**
 * ApplyForUs AI - Field-Level Encryption
 *
 * AES-256-GCM encryption for sensitive data fields.
 */

import * as crypto from 'crypto';

/**
 * Encryption algorithm and configuration
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 64;

/**
 * Encryption context for different data types
 */
export enum EncryptionContext {
  PII = 'pii', // Personally Identifiable Information
  FINANCIAL = 'financial', // Financial data
  CREDENTIALS = 'credentials', // Authentication credentials
  HEALTH = 'health', // Health information
  GENERAL = 'general', // General sensitive data
}

/**
 * Encrypted field structure
 */
export interface EncryptedField {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
  algorithm: string;
  context: EncryptionContext;
  version: number; // For key rotation support
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  context?: EncryptionContext;
  keyVersion?: number;
  additionalData?: string; // Additional authenticated data (AAD)
}

/**
 * Field Encryption Service
 */
export class FieldEncryption {
  private keyCache: Map<string, Buffer> = new Map();

  /**
   * Encrypt a field value
   */
  encryptField(
    value: string,
    key: string | Buffer,
    options: EncryptionOptions = {}
  ): EncryptedField {
    const {
      context = EncryptionContext.GENERAL,
      keyVersion = 1,
      additionalData,
    } = options;

    // Ensure key is a Buffer and correct length
    const keyBuffer = this.prepareKey(key);

    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // Set additional authenticated data if provided
    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }

    // Encrypt the data
    let encrypted = cipher.update(value, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: ALGORITHM,
      context,
      version: keyVersion,
    };
  }

  /**
   * Decrypt a field value
   */
  decryptField(
    encryptedField: EncryptedField,
    key: string | Buffer,
    additionalData?: string
  ): string {
    // Ensure key is a Buffer and correct length
    const keyBuffer = this.prepareKey(key);

    // Parse encrypted components
    const ciphertext = Buffer.from(encryptedField.ciphertext, 'base64');
    const iv = Buffer.from(encryptedField.iv, 'base64');
    const authTag = Buffer.from(encryptedField.authTag, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      encryptedField.algorithm,
      keyBuffer,
      iv
    );

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // Set additional authenticated data if provided
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData, 'utf8'));
    }

    // Decrypt the data
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt a simple string (returns base64 string instead of object)
   */
  encryptString(value: string, key: string | Buffer): string {
    const encrypted = this.encryptField(value, key);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt a simple string
   */
  decryptString(encryptedString: string, key: string | Buffer): string {
    const encrypted = JSON.parse(encryptedString) as EncryptedField;
    return this.decryptField(encrypted, key);
  }

  /**
   * Encrypt an object's sensitive fields
   */
  encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[],
    key: string | Buffer,
    options: EncryptionOptions = {}
  ): T {
    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
      const value = obj[field];
      if (value !== undefined && value !== null) {
        const stringValue =
          typeof value === 'string' ? value : JSON.stringify(value);
        result[field] = this.encryptString(stringValue, key) as any;
      }
    }

    return result;
  }

  /**
   * Decrypt an object's encrypted fields
   */
  decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: (keyof T)[],
    key: string | Buffer
  ): T {
    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
      const value = obj[field];
      if (value !== undefined && value !== null && typeof value === 'string') {
        try {
          result[field] = this.decryptString(value, key) as any;
        } catch (error) {
          // Field might not be encrypted, keep original value
          console.warn(`Failed to decrypt field ${String(field)}:`, error);
        }
      }
    }

    return result;
  }

  /**
   * Prepare encryption key (derive from password or use directly)
   */
  private prepareKey(key: string | Buffer): Buffer {
    if (Buffer.isBuffer(key)) {
      if (key.length !== KEY_LENGTH) {
        throw new Error(`Key must be ${KEY_LENGTH} bytes (256 bits)`);
      }
      return key;
    }

    // Derive key from password using PBKDF2
    const cacheKey = `derived:${key}`;
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Use a fixed salt for key derivation (in production, use environment-specific salt)
    const salt = crypto
      .createHash('sha256')
      .update('applyforus-ai-encryption-salt')
      .digest();

    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');
    this.keyCache.set(cacheKey, derivedKey);

    return derivedKey;
  }

  /**
   * Generate a random encryption key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(KEY_LENGTH);
  }

  /**
   * Generate a key from a password
   */
  generateKeyFromPassword(password: string, salt?: Buffer): Buffer {
    const saltBuffer = salt || crypto.randomBytes(SALT_LENGTH);
    return crypto.pbkdf2Sync(password, saltBuffer, 100000, KEY_LENGTH, 'sha256');
  }

  /**
   * Hash data (one-way, for comparison)
   */
  hashData(data: string, salt?: string): string {
    const hash = crypto.createHash('sha256');
    if (salt) {
      hash.update(salt);
    }
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Create HMAC for data integrity verification
   */
  createHMAC(data: string, key: string | Buffer): string {
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'utf8');
    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(data);
    return hmac.digest('hex');
  }

  /**
   * Verify HMAC
   */
  verifyHMAC(data: string, hmac: string, key: string | Buffer): boolean {
    const expectedHMAC = this.createHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHMAC, 'hex')
    );
  }

  /**
   * Clear key cache (for security)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
  }
}

/**
 * Utility functions for common encryption scenarios
 */
export class EncryptionUtils {
  private static fieldEncryption = new FieldEncryption();

  /**
   * Encrypt PII data
   */
  static encryptPII(value: string, key: string | Buffer): EncryptedField {
    return this.fieldEncryption.encryptField(value, key, {
      context: EncryptionContext.PII,
    });
  }

  /**
   * Encrypt financial data
   */
  static encryptFinancial(value: string, key: string | Buffer): EncryptedField {
    return this.fieldEncryption.encryptField(value, key, {
      context: EncryptionContext.FINANCIAL,
    });
  }

  /**
   * Encrypt credentials
   */
  static encryptCredentials(value: string, key: string | Buffer): EncryptedField {
    return this.fieldEncryption.encryptField(value, key, {
      context: EncryptionContext.CREDENTIALS,
    });
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(value: string, showChars: number = 4): string {
    if (!value || value.length <= showChars * 2) {
      return '***';
    }
    const start = value.substring(0, showChars);
    const end = value.substring(value.length - showChars);
    return `${start}***${end}`;
  }

  /**
   * Redact email for logging
   */
  static redactEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) {
      return '***@***';
    }
    const maskedUsername = this.maskSensitiveData(username, 2);
    return `${maskedUsername}@${domain}`;
  }
}

// Export singleton instance
export const fieldEncryption = new FieldEncryption();
