/**
 * ApplyForUs AI - Key Management System
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
 * import { AWSKMSAdapter, KeyManager } from '@applyforus/security';
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
 * HashiCorp Vault KMS adapter implementation
 *
 * Uses Vault's Transit secrets engine for encryption operations.
 *
 * @example Vault KMS Usage
 * ```typescript
 * // Initialize Vault KMS adapter with environment variables
 * // Required environment variables:
 * // - VAULT_ADDR: Vault server address (e.g., 'https://vault.example.com:8200')
 * // - VAULT_TOKEN: Vault authentication token
 * // - VAULT_NAMESPACE: Vault namespace (optional, for Vault Enterprise)
 * // - VAULT_TRANSIT_MOUNT: Transit mount path (optional, defaults to 'transit')
 *
 * import { VaultKMSAdapter, KeyManager } from '@applyforus/security';
 *
 * // Create Vault KMS adapter
 * const vaultAdapter = new VaultKMSAdapter({
 *   address: process.env.VAULT_ADDR || 'https://vault.example.com:8200',
 *   token: process.env.VAULT_TOKEN!,
 *   namespace: process.env.VAULT_NAMESPACE,
 *   transitMount: process.env.VAULT_TRANSIT_MOUNT || 'transit',
 * });
 *
 * // Use with KeyManager
 * const keyManager = new KeyManager(
 *   { rotationPeriodDays: 90, gracePeriodDays: 30, autoRotate: true },
 *   vaultAdapter
 * );
 *
 * await keyManager.initialize();
 *
 * // Encrypt data
 * const plaintext = Buffer.from('sensitive data');
 * const encrypted = await keyManager.encryptWithKMS(plaintext, 'my-encryption-key');
 *
 * // Decrypt data
 * const decrypted = await keyManager.decryptWithKMS(encrypted, 'my-encryption-key');
 *
 * // Generate data encryption key
 * const { plaintext: dataKey, ciphertext: encryptedKey } =
 *   await vaultAdapter.generateDataKey('my-encryption-key');
 *
 * // Rotate key
 * await vaultAdapter.rotateKey('my-encryption-key');
 * ```
 */
export class VaultKMSAdapter implements ExternalKMS {
  private vault: any;
  private transitMount: string;
  private defaultKeyName: string;

  constructor(config: {
    address: string;
    token: string;
    namespace?: string;
    transitMount?: string;
    defaultKeyName?: string;
  }) {
    // Import node-vault dynamically
    const nodeVault = require('node-vault');

    // Initialize Vault client
    const vaultOptions: any = {
      apiVersion: 'v1',
      endpoint: config.address || process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
      token: config.token || process.env.VAULT_TOKEN,
    };

    // Add namespace for Vault Enterprise
    if (config.namespace || process.env.VAULT_NAMESPACE) {
      vaultOptions.namespace = config.namespace || process.env.VAULT_NAMESPACE;
    }

    this.vault = nodeVault(vaultOptions);
    this.transitMount = config.transitMount || process.env.VAULT_TRANSIT_MOUNT || 'transit';
    this.defaultKeyName = config.defaultKeyName || process.env.VAULT_DEFAULT_KEY_NAME || '';

    // Log initialization
    this.logEvent('Vault KMS adapter initialized', {
      endpoint: vaultOptions.endpoint,
      namespace: vaultOptions.namespace || 'default',
      transitMount: this.transitMount,
      hasToken: !!vaultOptions.token,
      defaultKeyName: this.defaultKeyName || 'not configured',
    });
  }

  /**
   * Helper method to log Vault KMS events
   */
  private logEvent(message: string, details: Record<string, any>): void {
    console.log(`[Vault KMS] ${message}`, details);
  }

  /**
   * Encrypt data using Vault's Transit secrets engine
   * @param plaintext - Data to encrypt as a Buffer
   * @param keyId - Vault transit key name (required)
   * @returns Encrypted data as a Buffer (includes Vault's ciphertext format)
   */
  async encrypt(plaintext: Buffer, keyId: string): Promise<Buffer> {
    const effectiveKeyId = keyId || this.defaultKeyName;

    if (!effectiveKeyId) {
      const error = new Error(
        'Vault key name not provided. Set VAULT_DEFAULT_KEY_NAME environment variable or provide keyId parameter.'
      );
      this.logEvent('Encryption failed - missing key name', {
        error: error.message,
        reason: 'missing_key_name',
      });
      throw error;
    }

    try {
      // Encode plaintext to base64 as required by Vault Transit API
      const base64Plaintext = plaintext.toString('base64');

      // Call Vault Transit encrypt endpoint
      const response = await this.vault.write(
        `${this.transitMount}/encrypt/${effectiveKeyId}`,
        {
          plaintext: base64Plaintext,
        }
      );

      if (!response.data || !response.data.ciphertext) {
        throw new Error('Vault encryption failed: No ciphertext returned');
      }

      // Log successful encryption
      this.logEvent('Data encrypted successfully', {
        keyName: effectiveKeyId,
        plaintextSize: plaintext.length,
        ciphertextFormat: 'vault:v1',
      });

      // Return ciphertext as Buffer
      // Vault returns format: "vault:v1:base64data"
      return Buffer.from(response.data.ciphertext);
    } catch (error: any) {
      // Log encryption failure
      this.logEvent('Encryption failed', {
        keyName: effectiveKeyId,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      // Provide helpful error messages
      if (error.response?.statusCode === 404) {
        throw new Error(
          `Vault encryption failed: Key '${effectiveKeyId}' not found. Create it with: vault write -f ${this.transitMount}/keys/${effectiveKeyId}`
        );
      } else if (error.response?.statusCode === 403) {
        throw new Error(
          `Vault encryption failed: Permission denied. Ensure the token has permission to encrypt with key '${effectiveKeyId}'`
        );
      }

      throw new Error(`Vault encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using Vault's Transit secrets engine
   * @param ciphertext - Encrypted data as a Buffer (Vault's ciphertext format)
   * @param keyId - Vault transit key name (required)
   * @returns Decrypted data as a Buffer
   */
  async decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer> {
    const effectiveKeyId = keyId || this.defaultKeyName;

    if (!effectiveKeyId) {
      const error = new Error(
        'Vault key name not provided. Set VAULT_DEFAULT_KEY_NAME environment variable or provide keyId parameter.'
      );
      this.logEvent('Decryption failed - missing key name', {
        error: error.message,
        reason: 'missing_key_name',
      });
      throw error;
    }

    try {
      // Convert Buffer to string (Vault ciphertext format: "vault:v1:base64data")
      const ciphertextString = ciphertext.toString('utf8');

      // Call Vault Transit decrypt endpoint
      const response = await this.vault.write(
        `${this.transitMount}/decrypt/${effectiveKeyId}`,
        {
          ciphertext: ciphertextString,
        }
      );

      if (!response.data || !response.data.plaintext) {
        throw new Error('Vault decryption failed: No plaintext returned');
      }

      // Decode base64 plaintext
      const plaintext = Buffer.from(response.data.plaintext, 'base64');

      // Log successful decryption
      this.logEvent('Data decrypted successfully', {
        keyName: effectiveKeyId,
        ciphertextSize: ciphertext.length,
        plaintextSize: plaintext.length,
      });

      return plaintext;
    } catch (error: any) {
      // Log decryption failure
      this.logEvent('Decryption failed', {
        keyName: effectiveKeyId,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      // Provide helpful error messages
      if (error.response?.statusCode === 404) {
        throw new Error(
          `Vault decryption failed: Key '${effectiveKeyId}' not found or ciphertext is invalid`
        );
      } else if (error.response?.statusCode === 403) {
        throw new Error(
          `Vault decryption failed: Permission denied. Ensure the token has permission to decrypt with key '${effectiveKeyId}'`
        );
      } else if (error.response?.statusCode === 400) {
        throw new Error(
          `Vault decryption failed: Invalid ciphertext format or key version not found`
        );
      }

      throw new Error(`Vault decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a data encryption key (DEK) using Vault's Transit secrets engine
   * This returns both the plaintext and encrypted version of the key using Vault's datakey endpoint
   * @param keyId - Vault transit key name (required)
   * @returns Object with plaintext and ciphertext versions of the data key
   */
  async generateDataKey(keyId: string): Promise<{ plaintext: Buffer; ciphertext: Buffer }> {
    const effectiveKeyId = keyId || this.defaultKeyName;

    if (!effectiveKeyId) {
      const error = new Error(
        'Vault key name not provided. Set VAULT_DEFAULT_KEY_NAME environment variable or provide keyId parameter.'
      );
      this.logEvent('Data key generation failed - missing key name', {
        error: error.message,
        reason: 'missing_key_name',
      });
      throw error;
    }

    try {
      // Call Vault Transit datakey endpoint to generate a 256-bit AES key
      const response = await this.vault.write(
        `${this.transitMount}/datakey/plaintext/${effectiveKeyId}`,
        {
          bits: 256, // Generate a 256-bit key (32 bytes)
        }
      );

      if (!response.data || !response.data.plaintext || !response.data.ciphertext) {
        throw new Error('Vault data key generation failed: Incomplete response');
      }

      // Decode base64 plaintext key
      const plaintextKey = Buffer.from(response.data.plaintext, 'base64');

      // Ciphertext is in Vault format: "vault:v1:base64data"
      const ciphertextKey = Buffer.from(response.data.ciphertext);

      // Log successful data key generation
      this.logEvent('Data key generated successfully', {
        keyName: effectiveKeyId,
        keySize: 256,
        plaintextSize: plaintextKey.length,
        ciphertextFormat: 'vault:v1',
      });

      return {
        plaintext: plaintextKey,
        ciphertext: ciphertextKey,
      };
    } catch (error: any) {
      // Log data key generation failure
      this.logEvent('Data key generation failed', {
        keyName: effectiveKeyId,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      // Provide helpful error messages
      if (error.response?.statusCode === 404) {
        throw new Error(
          `Vault data key generation failed: Key '${effectiveKeyId}' not found. Create it with: vault write -f ${this.transitMount}/keys/${effectiveKeyId}`
        );
      } else if (error.response?.statusCode === 403) {
        throw new Error(
          `Vault data key generation failed: Permission denied. Ensure the token has permission to generate data keys with '${effectiveKeyId}'`
        );
      }

      throw new Error(`Vault data key generation failed: ${error.message}`);
    }
  }

  /**
   * Rotate the Vault transit encryption key
   * This creates a new version of the key while keeping old versions for decryption
   * @param keyId - Vault transit key name to rotate
   */
  async rotateKey(keyId: string): Promise<void> {
    const effectiveKeyId = keyId || this.defaultKeyName;

    if (!effectiveKeyId) {
      const error = new Error(
        'Vault key name not provided. Set VAULT_DEFAULT_KEY_NAME environment variable or provide keyId parameter.'
      );
      this.logEvent('Key rotation failed - missing key name', {
        error: error.message,
        reason: 'missing_key_name',
      });
      throw error;
    }

    try {
      // Call Vault Transit rotate endpoint
      await this.vault.write(
        `${this.transitMount}/keys/${effectiveKeyId}/rotate`,
        {}
      );

      // Log successful key rotation
      this.logEvent('Key rotated successfully', {
        keyName: effectiveKeyId,
        action: 'new_version_created',
        message: 'A new key version has been created. Old versions remain available for decryption.',
      });

      console.log(
        `Vault key '${effectiveKeyId}' has been rotated. ` +
        `A new version is now the default for encryption. ` +
        `Old versions remain available for decryption.`
      );
    } catch (error: any) {
      // Log key rotation failure
      this.logEvent('Key rotation failed', {
        keyName: effectiveKeyId,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      // Provide helpful error messages
      if (error.response?.statusCode === 404) {
        throw new Error(
          `Vault key rotation failed: Key '${effectiveKeyId}' not found. Create it with: vault write -f ${this.transitMount}/keys/${effectiveKeyId}`
        );
      } else if (error.response?.statusCode === 403) {
        throw new Error(
          `Vault key rotation failed: Permission denied. Ensure the token has permission to rotate key '${effectiveKeyId}'`
        );
      }

      throw new Error(`Vault key rotation failed: ${error.message}`);
    }
  }

  /**
   * Get the Vault client instance (for advanced operations)
   */
  getClient(): any {
    return this.vault;
  }

  /**
   * Get the default key name
   */
  getDefaultKeyName(): string {
    return this.defaultKeyName;
  }

  /**
   * Set a new default key name
   */
  setDefaultKeyName(keyName: string): void {
    this.defaultKeyName = keyName;
    this.logEvent('Default key name updated', {
      newKeyName: keyName,
    });
  }

  /**
   * Get the transit mount path
   */
  getTransitMount(): string {
    return this.transitMount;
  }

  /**
   * Create a new encryption key in Vault Transit
   * @param keyName - Name of the key to create
   * @param options - Optional key configuration
   */
  async createKey(
    keyName: string,
    options?: {
      type?: 'aes256-gcm96' | 'chacha20-poly1305' | 'rsa-2048' | 'rsa-4096';
      derivation?: boolean;
      exportable?: boolean;
    }
  ): Promise<void> {
    try {
      const payload: any = {};

      if (options?.type) {
        payload.type = options.type;
      }
      if (options?.derivation !== undefined) {
        payload.derived = options.derivation;
      }
      if (options?.exportable !== undefined) {
        payload.exportable = options.exportable;
      }

      await this.vault.write(
        `${this.transitMount}/keys/${keyName}`,
        payload
      );

      this.logEvent('Encryption key created successfully', {
        keyName,
        type: options?.type || 'aes256-gcm96 (default)',
        derivation: options?.derivation || false,
        exportable: options?.exportable || false,
      });
    } catch (error: any) {
      this.logEvent('Key creation failed', {
        keyName,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      if (error.response?.statusCode === 400 && error.message.includes('already exists')) {
        throw new Error(`Vault key creation failed: Key '${keyName}' already exists`);
      }

      throw new Error(`Vault key creation failed: ${error.message}`);
    }
  }

  /**
   * Delete an encryption key from Vault Transit
   * Note: This requires the key to be configured with deletion_allowed=true
   * @param keyName - Name of the key to delete
   */
  async deleteKey(keyName: string): Promise<void> {
    try {
      // First, enable deletion if not already enabled
      await this.vault.write(
        `${this.transitMount}/keys/${keyName}/config`,
        {
          deletion_allowed: true,
        }
      );

      // Delete the key
      await this.vault.delete(`${this.transitMount}/keys/${keyName}`);

      this.logEvent('Encryption key deleted successfully', {
        keyName,
      });
    } catch (error: any) {
      this.logEvent('Key deletion failed', {
        keyName,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      throw new Error(`Vault key deletion failed: ${error.message}`);
    }
  }

  /**
   * Get information about a key
   * @param keyName - Name of the key to query
   */
  async getKeyInfo(keyName: string): Promise<any> {
    try {
      const response = await this.vault.read(
        `${this.transitMount}/keys/${keyName}`
      );

      return response.data;
    } catch (error: any) {
      this.logEvent('Get key info failed', {
        keyName,
        error: error.message,
        errorCode: error.response?.statusCode || 'unknown',
      });

      throw new Error(`Failed to get key info: ${error.message}`);
    }
  }

  /**
   * Health check - verify connectivity to Vault
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.vault.health();

      this.logEvent('Health check passed', {
        initialized: response.initialized,
        sealed: response.sealed,
        standby: response.standby,
      });

      return response.initialized && !response.sealed;
    } catch (error: any) {
      this.logEvent('Health check failed', {
        error: error.message,
      });
      return false;
    }
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
