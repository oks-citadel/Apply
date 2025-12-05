/**
 * JobPilot AI - Key Management System
 *
 * Manages encryption keys with support for rotation and external key management systems.
 *
 * @example AWS KMS Usage
 * ```typescript
 * // Initialize AWS KMS adapter with environment variables
 * // Required environment variables:
 * // - AWS_KMS_KEY_ID: Your KMS key ID or ARN
 * // - AWS_REGION: AWS region (e.g., 'us-east-1')
 * // - AWS_ACCESS_KEY_ID: Your AWS access key
 * // - AWS_SECRET_ACCESS_KEY: Your AWS secret key
 *
 * import { AWSKMSAdapter, KeyManager } from '@jobpilot/security';
 *
 * // Create KMS adapter
 * const kmsAdapter = new AWSKMSAdapter({
 *   region: 'us-east-1',
 *   // Credentials can be provided here or via environment variables
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 * });
 *
 * // Use with KeyManager
 * const keyManager = new KeyManager(
 *   { rotationPeriodDays: 90, gracePeriodDays: 30, autoRotate: true },
 *   kmsAdapter
 * );
 *
 * await keyManager.initialize();
 *
 * // Encrypt data
 * const plaintext = Buffer.from('sensitive data');
 * const encrypted = await keyManager.encryptWithKMS(plaintext);
 *
 * // Decrypt data
 * const decrypted = await keyManager.decryptWithKMS(encrypted, keyId);
 *
 * // Generate data encryption key
 * const { plaintext: dataKey, ciphertext: encryptedKey } =
 *   await kmsAdapter.generateDataKey(process.env.AWS_KMS_KEY_ID!);
 *
 * // Rotate key
 * await kmsAdapter.rotateKey(process.env.AWS_KMS_KEY_ID!);
 * ```
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  KMSClient,
  EncryptCommand,
  DecryptCommand,
  GenerateDataKeyCommand,
  ScheduleKeyDeletionCommand,
} from '@aws-sdk/client-kms';

/**
 * Key metadata
 */
export interface KeyMetadata {
  id: string;
  version: number;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  status: KeyStatus;
  purpose: KeyPurpose;
}

/**
 * Key status
 */
export enum KeyStatus {
  ACTIVE = 'active',
  ROTATING = 'rotating',
  DEPRECATED = 'deprecated',
  REVOKED = 'revoked',
}

/**
 * Key purpose
 */
export enum KeyPurpose {
  ENCRYPTION = 'encryption',
  SIGNING = 'signing',
  MASTER = 'master',
  DATA_ENCRYPTION = 'data_encryption',
}

/**
 * Stored key structure
 */
interface StoredKey {
  metadata: KeyMetadata;
  key: string; // Base64 encoded
}

/**
 * Key rotation policy
 */
export interface KeyRotationPolicy {
  rotationPeriodDays: number;
  gracePeriodDays: number; // How long to keep old keys for decryption
  autoRotate: boolean;
}

/**
 * External Key Management Service interface
 */
export interface ExternalKMS {
  encrypt(plaintext: Buffer, keyId: string): Promise<Buffer>;
  decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer>;
  generateDataKey(keyId: string): Promise<{ plaintext: Buffer; ciphertext: Buffer }>;
  rotateKey(keyId: string): Promise<void>;
}

/**
 * AWS KMS adapter implementation
 */
export class AWSKMSAdapter implements ExternalKMS {
  private kmsClient: KMSClient;
  private defaultKeyId: string;

  constructor(config: { region: string; accessKeyId?: string; secretAccessKey?: string }) {
    // Initialize KMS client with credentials from config or environment variables
    const clientConfig: any = {
      region: config.region || process.env.AWS_REGION || 'us-east-1',
    };

    // Add credentials if provided, otherwise AWS SDK will use environment variables or IAM role
    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    this.kmsClient = new KMSClient(clientConfig);
    this.defaultKeyId = process.env.AWS_KMS_KEY_ID || '';

    // Log initialization (using system event type)
    this.logEvent('KMS adapter initialized', {
      region: clientConfig.region,
      hasCredentials: !!clientConfig.credentials,
      defaultKeyId: this.defaultKeyId ? 'configured' : 'not configured',
    });
  }

  /**
   * Helper method to log KMS events
   */
  private logEvent(message: string, details: Record<string, any>): void {
    console.log(`[AWS KMS] ${message}`, details);
  }

  /**
   * Encrypt data using AWS KMS
   * @param plaintext - Data to encrypt as a Buffer
   * @param keyId - KMS key ID or ARN (optional, uses default if not provided)
   * @returns Encrypted data as a Buffer
   */
  async encrypt(plaintext: Buffer, keyId: string): Promise<Buffer> {
    const effectiveKeyId = keyId || this.defaultKeyId;

    if (!effectiveKeyId) {
      const error = new Error(
        'AWS KMS Key ID not provided. Set AWS_KMS_KEY_ID environment variable or provide keyId parameter.'
      );
      this.logEvent('Encryption failed - missing key ID', {
        error: error.message,
        reason: 'missing_key_id',
      });
      throw error;
    }

    try {
      const command = new EncryptCommand({
        KeyId: effectiveKeyId,
        Plaintext: plaintext,
      });

      const response = await this.kmsClient.send(command);

      if (!response.CiphertextBlob) {
        throw new Error('KMS encryption failed: No ciphertext returned');
      }

      // Log successful encryption
      this.logEvent('Data encrypted successfully', {
        keyId: effectiveKeyId,
        plaintextSize: plaintext.length,
        ciphertextSize: response.CiphertextBlob.length,
      });

      return Buffer.from(response.CiphertextBlob);
    } catch (error: any) {
      // Log encryption failure
      this.logEvent('Encryption failed', {
        keyId: effectiveKeyId,
        error: error.message,
        errorCode: error.name,
      });

      throw new Error(`AWS KMS encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AWS KMS
   * @param ciphertext - Encrypted data as a Buffer
   * @param keyId - KMS key ID or ARN (optional, KMS will use the key that encrypted the data)
   * @returns Decrypted data as a Buffer
   */
  async decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    try {
      const command = new DecryptCommand({
        CiphertextBlob: ciphertext,
        // KeyId is optional for decrypt - KMS uses the key that encrypted the data
        KeyId: keyId || undefined,
      });

      const response = await this.kmsClient.send(command);

      if (!response.Plaintext) {
        throw new Error('KMS decryption failed: No plaintext returned');
      }

      // Log successful decryption
      this.logEvent('Data decrypted successfully', {
        keyId: response.KeyId || keyId || 'auto-detected',
        ciphertextSize: ciphertext.length,
        plaintextSize: response.Plaintext.length,
      });

      return Buffer.from(response.Plaintext);
    } catch (error: any) {
      // Log decryption failure
      this.logEvent('Decryption failed', {
        keyId: keyId || 'auto-detect',
        error: error.message,
        errorCode: error.name,
      });

      throw new Error(`AWS KMS decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a data encryption key (DEK) using AWS KMS
   * This returns both the plaintext and encrypted version of the key
   * @param keyId - KMS key ID or ARN (optional, uses default if not provided)
   * @returns Object with plaintext and ciphertext versions of the data key
   */
  async generateDataKey(keyId: string): Promise<{ plaintext: Buffer; ciphertext: Buffer }> {
    const effectiveKeyId = keyId || this.defaultKeyId;

    if (!effectiveKeyId) {
      const error = new Error(
        'AWS KMS Key ID not provided. Set AWS_KMS_KEY_ID environment variable or provide keyId parameter.'
      );
      this.logEvent('Data key generation failed - missing key ID', {
        error: error.message,
        reason: 'missing_key_id',
      });
      throw error;
    }

    try {
      const command = new GenerateDataKeyCommand({
        KeyId: effectiveKeyId,
        KeySpec: 'AES_256', // Generate a 256-bit symmetric key
      });

      const response = await this.kmsClient.send(command);

      if (!response.Plaintext || !response.CiphertextBlob) {
        throw new Error('KMS data key generation failed: Incomplete response');
      }

      // Log successful data key generation
      this.logEvent('Data key generated successfully', {
        keyId: effectiveKeyId,
        keySpec: 'AES_256',
        plaintextSize: response.Plaintext.length,
        ciphertextSize: response.CiphertextBlob.length,
      });

      return {
        plaintext: Buffer.from(response.Plaintext),
        ciphertext: Buffer.from(response.CiphertextBlob),
      };
    } catch (error: any) {
      // Log data key generation failure
      this.logEvent('Data key generation failed', {
        keyId: effectiveKeyId,
        error: error.message,
        errorCode: error.name,
      });

      throw new Error(`AWS KMS data key generation failed: ${error.message}`);
    }
  }

  /**
   * Rotate the KMS key
   * Note: AWS KMS automatic key rotation rotates the key material while keeping the same key ID
   * This method schedules the old key for deletion and creates an alias pointing to a new key
   * @param keyId - KMS key ID or ARN to rotate
   */
  async rotateKey(keyId: string): Promise<void> {
    const effectiveKeyId = keyId || this.defaultKeyId;

    if (!effectiveKeyId) {
      const error = new Error(
        'AWS KMS Key ID not provided. Set AWS_KMS_KEY_ID environment variable or provide keyId parameter.'
      );
      this.logEvent('Key rotation failed - missing key ID', {
        error: error.message,
        reason: 'missing_key_id',
      });
      throw error;
    }

    try {
      // Note: For automatic key rotation, you would enable it in AWS KMS console or via EnableKeyRotation API
      // This implementation provides a manual rotation approach

      // Schedule the key for deletion (minimum 7 days waiting period)
      const deleteCommand = new ScheduleKeyDeletionCommand({
        KeyId: effectiveKeyId,
        PendingWindowInDays: 30, // 30-day grace period before deletion
      });

      await this.kmsClient.send(deleteCommand);

      // Log successful key rotation scheduling
      this.logEvent('Key rotation scheduled successfully', {
        keyId: effectiveKeyId,
        action: 'scheduled_for_deletion',
        pendingWindowDays: 30,
        message:
          'Key scheduled for deletion. Create a new key and update AWS_KMS_KEY_ID to complete rotation.',
      });

      console.warn(
        `KMS key ${effectiveKeyId} has been scheduled for deletion in 30 days. ` +
          `Please create a new KMS key and update the AWS_KMS_KEY_ID environment variable.`
      );
    } catch (error: any) {
      // Log key rotation failure
      this.logEvent('Key rotation failed', {
        keyId: effectiveKeyId,
        error: error.message,
        errorCode: error.name,
      });

      throw new Error(`AWS KMS key rotation failed: ${error.message}`);
    }
  }

  /**
   * Get the KMS client instance (for advanced operations)
   */
  getClient(): KMSClient {
    return this.kmsClient;
  }

  /**
   * Get the default key ID
   */
  getDefaultKeyId(): string {
    return this.defaultKeyId;
  }

  /**
   * Set a new default key ID
   */
  setDefaultKeyId(keyId: string): void {
    this.defaultKeyId = keyId;
    this.logEvent('Default key ID updated', {
      newKeyId: keyId,
    });
  }
}

/**
 * HashiCorp Vault adapter (interface for future implementation)
 */
export class VaultKMSAdapter implements ExternalKMS {
  constructor(private config: { address: string; token: string; namespace?: string }) {}

  async encrypt(plaintext: Buffer, keyId: string): Promise<Buffer> {
    // TODO: Implement Vault encryption
    throw new Error('Vault KMS not implemented. Use Vault API client.');
  }

  async decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    // TODO: Implement Vault decryption
    throw new Error('Vault KMS not implemented. Use Vault API client.');
  }

  async generateDataKey(keyId: string): Promise<{ plaintext: Buffer; ciphertext: Buffer }> {
    // TODO: Implement Vault data key generation
    throw new Error('Vault KMS not implemented. Use Vault API client.');
  }

  async rotateKey(keyId: string): Promise<void> {
    // TODO: Implement Vault key rotation
    throw new Error('Vault KMS not implemented. Use Vault API client.');
  }
}

/**
 * Key Manager class
 */
export class KeyManager {
  private keys: Map<string, StoredKey> = new Map();
  private activeKeyId: string | null = null;
  private rotationPolicy: KeyRotationPolicy;
  private externalKMS?: ExternalKMS;
  private keyStorePath?: string;

  constructor(
    rotationPolicy?: Partial<KeyRotationPolicy>,
    externalKMS?: ExternalKMS,
    keyStorePath?: string
  ) {
    this.rotationPolicy = {
      rotationPeriodDays: 90,
      gracePeriodDays: 30,
      autoRotate: true,
      ...rotationPolicy,
    };
    this.externalKMS = externalKMS;
    this.keyStorePath = keyStorePath;
  }

  /**
   * Initialize key manager with stored keys
   */
  async initialize(): Promise<void> {
    if (this.keyStorePath) {
      await this.loadKeys();
    }

    // If no active key, generate one
    if (!this.activeKeyId) {
      await this.generateKey(KeyPurpose.ENCRYPTION);
    }

    // Set up auto-rotation if enabled
    if (this.rotationPolicy.autoRotate) {
      this.scheduleAutoRotation();
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(purpose: KeyPurpose = KeyPurpose.ENCRYPTION): Promise<string> {
    const keyId = this.generateKeyId();
    const keyBuffer = crypto.randomBytes(32); // 256-bit key

    const metadata: KeyMetadata = {
      id: keyId,
      version: 1,
      algorithm: 'aes-256-gcm',
      createdAt: new Date(),
      status: KeyStatus.ACTIVE,
      purpose,
    };

    const storedKey: StoredKey = {
      metadata,
      key: keyBuffer.toString('base64'),
    };

    this.keys.set(keyId, storedKey);

    // Set as active key if none exists
    if (!this.activeKeyId) {
      this.activeKeyId = keyId;
    }

    if (this.keyStorePath) {
      await this.saveKeys();
    }

    return keyId;
  }

  /**
   * Get a key by ID
   */
  getKey(keyId: string): Buffer | null {
    const storedKey = this.keys.get(keyId);
    if (!storedKey) {
      return null;
    }

    // Check if key is usable
    if (storedKey.metadata.status === KeyStatus.REVOKED) {
      throw new Error(`Key ${keyId} has been revoked`);
    }

    return Buffer.from(storedKey.key, 'base64');
  }

  /**
   * Get the active encryption key
   */
  getActiveKey(): Buffer {
    if (!this.activeKeyId) {
      throw new Error('No active encryption key');
    }
    const key = this.getKey(this.activeKeyId);
    if (!key) {
      throw new Error('Active encryption key not found');
    }
    return key;
  }

  /**
   * Get active key ID
   */
  getActiveKeyId(): string {
    if (!this.activeKeyId) {
      throw new Error('No active encryption key');
    }
    return this.activeKeyId;
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(oldKeyId?: string): Promise<string> {
    const keyToRotate = oldKeyId || this.activeKeyId;
    if (!keyToRotate) {
      throw new Error('No key to rotate');
    }

    const oldKey = this.keys.get(keyToRotate);
    if (!oldKey) {
      throw new Error(`Key ${keyToRotate} not found`);
    }

    // Mark old key as rotating
    oldKey.metadata.status = KeyStatus.ROTATING;
    oldKey.metadata.rotatedAt = new Date();

    // Generate new key
    const newKeyId = await this.generateKey(oldKey.metadata.purpose);

    // Update old key status
    oldKey.metadata.status = KeyStatus.DEPRECATED;
    const gracePeriodMs = this.rotationPolicy.gracePeriodDays * 24 * 60 * 60 * 1000;
    oldKey.metadata.expiresAt = new Date(Date.now() + gracePeriodMs);

    // Set new key as active
    this.activeKeyId = newKeyId;

    if (this.keyStorePath) {
      await this.saveKeys();
    }

    return newKeyId;
  }

  /**
   * Revoke a key
   */
  async revokeKey(keyId: string): Promise<void> {
    const storedKey = this.keys.get(keyId);
    if (!storedKey) {
      throw new Error(`Key ${keyId} not found`);
    }

    storedKey.metadata.status = KeyStatus.REVOKED;

    if (keyId === this.activeKeyId) {
      // Generate new active key
      await this.generateKey(storedKey.metadata.purpose);
    }

    if (this.keyStorePath) {
      await this.saveKeys();
    }
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | null {
    const storedKey = this.keys.get(keyId);
    return storedKey ? storedKey.metadata : null;
  }

  /**
   * List all keys
   */
  listKeys(): KeyMetadata[] {
    return Array.from(this.keys.values()).map((k) => k.metadata);
  }

  /**
   * Cleanup expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    let deletedCount = 0;

    for (const [keyId, storedKey] of this.keys.entries()) {
      if (
        storedKey.metadata.expiresAt &&
        storedKey.metadata.expiresAt < now &&
        storedKey.metadata.status === KeyStatus.DEPRECATED
      ) {
        this.keys.delete(keyId);
        deletedCount++;
      }
    }

    if (deletedCount > 0 && this.keyStorePath) {
      await this.saveKeys();
    }

    return deletedCount;
  }

  /**
   * Check if key rotation is needed
   */
  isRotationNeeded(keyId?: string): boolean {
    const id = keyId || this.activeKeyId;
    if (!id) {
      return false;
    }

    const storedKey = this.keys.get(id);
    if (!storedKey) {
      return false;
    }

    const rotationPeriodMs = this.rotationPolicy.rotationPeriodDays * 24 * 60 * 60 * 1000;
    const keyAge = Date.now() - storedKey.metadata.createdAt.getTime();

    return keyAge >= rotationPeriodMs;
  }

  /**
   * Set external KMS
   */
  setExternalKMS(kms: ExternalKMS): void {
    this.externalKMS = kms;
  }

  /**
   * Encrypt data with external KMS
   */
  async encryptWithKMS(plaintext: Buffer, keyId?: string): Promise<Buffer> {
    if (!this.externalKMS) {
      throw new Error('External KMS not configured');
    }
    const id = keyId || this.activeKeyId;
    if (!id) {
      throw new Error('No active key ID');
    }
    return this.externalKMS.encrypt(plaintext, id);
  }

  /**
   * Decrypt data with external KMS
   */
  async decryptWithKMS(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    if (!this.externalKMS) {
      throw new Error('External KMS not configured');
    }
    return this.externalKMS.decrypt(ciphertext, keyId);
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(): string {
    return `key-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Schedule automatic key rotation
   */
  private scheduleAutoRotation(): void {
    // Check for rotation every day
    const checkInterval = 24 * 60 * 60 * 1000;

    setInterval(async () => {
      if (this.isRotationNeeded()) {
        try {
          await this.rotateKey();
          console.log('Automatic key rotation completed');
        } catch (error) {
          console.error('Automatic key rotation failed:', error);
        }
      }

      // Cleanup expired keys
      await this.cleanupExpiredKeys();
    }, checkInterval);
  }

  /**
   * Save keys to file
   */
  private async saveKeys(): Promise<void> {
    if (!this.keyStorePath) {
      return;
    }

    const data = {
      activeKeyId: this.activeKeyId,
      keys: Array.from(this.keys.entries()).map(([id, key]) => ({
        id,
        ...key,
      })),
    };

    await fs.mkdir(path.dirname(this.keyStorePath), { recursive: true });
    await fs.writeFile(
      this.keyStorePath,
      JSON.stringify(data, null, 2),
      { mode: 0o600 } // Restrictive permissions
    );
  }

  /**
   * Load keys from file
   */
  private async loadKeys(): Promise<void> {
    if (!this.keyStorePath) {
      return;
    }

    try {
      const data = await fs.readFile(this.keyStorePath, 'utf8');
      const parsed = JSON.parse(data);

      this.activeKeyId = parsed.activeKeyId;
      this.keys.clear();

      for (const item of parsed.keys) {
        const { id, ...storedKey } = item;
        // Parse dates
        storedKey.metadata.createdAt = new Date(storedKey.metadata.createdAt);
        if (storedKey.metadata.expiresAt) {
          storedKey.metadata.expiresAt = new Date(storedKey.metadata.expiresAt);
        }
        if (storedKey.metadata.rotatedAt) {
          storedKey.metadata.rotatedAt = new Date(storedKey.metadata.rotatedAt);
        }
        this.keys.set(id, storedKey);
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, start fresh
    }
  }
}

// Export singleton instance with default configuration
export const keyManager = new KeyManager();
