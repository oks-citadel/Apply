/**
 * VaultKMSAdapter Tests
 *
 * These tests verify the VaultKMSAdapter implementation.
 * Note: These are integration tests that require a running Vault instance.
 */

import { VaultKMSAdapter } from '../key-management';

// Create a shared mock vault instance
const mockVaultInstance = {
  write: jest.fn(),
  read: jest.fn(),
  delete: jest.fn(),
  health: jest.fn(),
};

// Mock node-vault for unit tests
jest.mock('node-vault', () => {
  return jest.fn(() => mockVaultInstance);
});

describe('VaultKMSAdapter', () => {
  let vaultAdapter: VaultKMSAdapter;
  let mockVault: typeof mockVaultInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset mock implementations
    mockVaultInstance.write.mockReset();
    mockVaultInstance.read.mockReset();
    mockVaultInstance.delete.mockReset();
    mockVaultInstance.health.mockReset();

    // Use the shared mock instance
    mockVault = mockVaultInstance;

    // Create adapter
    vaultAdapter = new VaultKMSAdapter({
      address: 'http://127.0.0.1:8200',
      token: 'test-token',
      transitMount: 'transit',
      defaultKeyName: 'test-key',
    });
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(vaultAdapter).toBeDefined();
      expect(vaultAdapter.getDefaultKeyName()).toBe('test-key');
      expect(vaultAdapter.getTransitMount()).toBe('transit');
    });

    it('should use environment variables as fallback', () => {
      process.env.VAULT_ADDR = 'http://vault.example.com:8200';
      process.env.VAULT_TOKEN = 'env-token';
      process.env.VAULT_TRANSIT_MOUNT = 'encryption';
      process.env.VAULT_DEFAULT_KEY_NAME = 'env-key';

      const adapter = new VaultKMSAdapter({
        address: '',
        token: '',
      });

      expect(adapter).toBeDefined();
    });
  });

  describe('encrypt', () => {
    it('should encrypt data successfully', async () => {
      const plaintext = Buffer.from('test data');
      const mockCiphertext = 'vault:v1:base64encrypteddata';

      mockVault.write.mockResolvedValue({
        data: {
          ciphertext: mockCiphertext,
        },
      });

      const result = await vaultAdapter.encrypt(plaintext, 'test-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/encrypt/test-key',
        {
          plaintext: plaintext.toString('base64'),
        }
      );
      expect(result).toEqual(Buffer.from(mockCiphertext));
    });

    it('should throw error if key name not provided', async () => {
      // Clear environment variables that might provide a default key
      const originalEnvKey = process.env.VAULT_DEFAULT_KEY_NAME;
      delete process.env.VAULT_DEFAULT_KEY_NAME;

      const adapter = new VaultKMSAdapter({
        address: 'http://127.0.0.1:8200',
        token: 'test-token',
        defaultKeyName: '', // Explicitly set empty
      });

      const plaintext = Buffer.from('test data');

      await expect(adapter.encrypt(plaintext, '')).rejects.toThrow(
        'Vault key name not provided'
      );

      // Restore environment variable
      if (originalEnvKey) {
        process.env.VAULT_DEFAULT_KEY_NAME = originalEnvKey;
      }
    });

    it('should handle 404 error with helpful message', async () => {
      const plaintext = Buffer.from('test data');

      mockVault.write.mockRejectedValue({
        message: 'Not found',
        response: { statusCode: 404 },
      });

      await expect(vaultAdapter.encrypt(plaintext, 'test-key')).rejects.toThrow(
        "Key 'test-key' not found"
      );
    });

    it('should handle 403 error with helpful message', async () => {
      const plaintext = Buffer.from('test data');

      mockVault.write.mockRejectedValue({
        message: 'Permission denied',
        response: { statusCode: 403 },
      });

      await expect(vaultAdapter.encrypt(plaintext, 'test-key')).rejects.toThrow(
        'Permission denied'
      );
    });
  });

  describe('decrypt', () => {
    it('should decrypt data successfully', async () => {
      const ciphertext = Buffer.from('vault:v1:base64encrypteddata');
      const mockPlaintext = Buffer.from('test data').toString('base64');

      mockVault.write.mockResolvedValue({
        data: {
          plaintext: mockPlaintext,
        },
      });

      const result = await vaultAdapter.decrypt(ciphertext, 'test-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/decrypt/test-key',
        {
          ciphertext: ciphertext.toString('utf8'),
        }
      );
      expect(result.toString()).toBe('test data');
    });

    it('should throw error if key name not provided', async () => {
      // Clear environment variables that might provide a default key
      const originalEnvKey = process.env.VAULT_DEFAULT_KEY_NAME;
      delete process.env.VAULT_DEFAULT_KEY_NAME;

      const adapter = new VaultKMSAdapter({
        address: 'http://127.0.0.1:8200',
        token: 'test-token',
        defaultKeyName: '', // Explicitly set empty
      });

      const ciphertext = Buffer.from('vault:v1:base64encrypteddata');

      await expect(adapter.decrypt(ciphertext, '')).rejects.toThrow(
        'Vault key name not provided'
      );

      // Restore environment variable
      if (originalEnvKey) {
        process.env.VAULT_DEFAULT_KEY_NAME = originalEnvKey;
      }
    });

    it('should handle decryption errors', async () => {
      const ciphertext = Buffer.from('vault:v1:base64encrypteddata');

      mockVault.write.mockRejectedValue({
        message: 'Invalid ciphertext',
        response: { statusCode: 400 },
      });

      await expect(vaultAdapter.decrypt(ciphertext, 'test-key')).rejects.toThrow(
        'Invalid ciphertext format'
      );
    });
  });

  describe('generateDataKey', () => {
    it('should generate data key successfully', async () => {
      const mockPlaintext = Buffer.from('test-key-32-bytes-long-enough!!').toString('base64');
      const mockCiphertext = 'vault:v1:encryptedkey';

      mockVault.write.mockResolvedValue({
        data: {
          plaintext: mockPlaintext,
          ciphertext: mockCiphertext,
        },
      });

      const result = await vaultAdapter.generateDataKey('test-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/datakey/plaintext/test-key',
        {
          bits: 256,
        }
      );
      expect(result.plaintext).toBeDefined();
      expect(result.ciphertext).toBeDefined();
      expect(result.ciphertext.toString()).toBe(mockCiphertext);
    });

    it('should throw error if key name not provided', async () => {
      // Clear environment variables that might provide a default key
      const originalEnvKey = process.env.VAULT_DEFAULT_KEY_NAME;
      delete process.env.VAULT_DEFAULT_KEY_NAME;

      const adapter = new VaultKMSAdapter({
        address: 'http://127.0.0.1:8200',
        token: 'test-token',
        defaultKeyName: '', // Explicitly set empty
      });

      await expect(adapter.generateDataKey('')).rejects.toThrow(
        'Vault key name not provided'
      );

      // Restore environment variable
      if (originalEnvKey) {
        process.env.VAULT_DEFAULT_KEY_NAME = originalEnvKey;
      }
    });
  });

  describe('rotateKey', () => {
    it('should rotate key successfully', async () => {
      mockVault.write.mockResolvedValue({});

      await vaultAdapter.rotateKey('test-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/keys/test-key/rotate',
        {}
      );
    });

    it('should throw error if key name not provided', async () => {
      // Clear environment variables that might provide a default key
      const originalEnvKey = process.env.VAULT_DEFAULT_KEY_NAME;
      delete process.env.VAULT_DEFAULT_KEY_NAME;

      const adapter = new VaultKMSAdapter({
        address: 'http://127.0.0.1:8200',
        token: 'test-token',
        defaultKeyName: '', // Explicitly set empty
      });

      await expect(adapter.rotateKey('')).rejects.toThrow(
        'Vault key name not provided'
      );

      // Restore environment variable
      if (originalEnvKey) {
        process.env.VAULT_DEFAULT_KEY_NAME = originalEnvKey;
      }
    });

    it('should handle rotation errors', async () => {
      mockVault.write.mockRejectedValue({
        message: 'Not found',
        response: { statusCode: 404 },
      });

      await expect(vaultAdapter.rotateKey('test-key')).rejects.toThrow(
        "Key 'test-key' not found"
      );
    });
  });

  describe('createKey', () => {
    it('should create key with default options', async () => {
      mockVault.write.mockResolvedValue({});

      await vaultAdapter.createKey('new-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/keys/new-key',
        {}
      );
    });

    it('should create key with custom options', async () => {
      mockVault.write.mockResolvedValue({});

      await vaultAdapter.createKey('new-key', {
        type: 'aes256-gcm96',
        derivation: true,
        exportable: false,
      });

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/keys/new-key',
        {
          type: 'aes256-gcm96',
          derived: true,
          exportable: false,
        }
      );
    });

    it('should handle key already exists error', async () => {
      mockVault.write.mockRejectedValue({
        message: 'key already exists',
        response: { statusCode: 400 },
      });

      await expect(vaultAdapter.createKey('existing-key')).rejects.toThrow(
        "Key 'existing-key' already exists"
      );
    });
  });

  describe('deleteKey', () => {
    it('should delete key successfully', async () => {
      mockVault.write.mockResolvedValue({});
      mockVault.delete.mockResolvedValue({});

      await vaultAdapter.deleteKey('old-key');

      expect(mockVault.write).toHaveBeenCalledWith(
        'transit/keys/old-key/config',
        {
          deletion_allowed: true,
        }
      );
      expect(mockVault.delete).toHaveBeenCalledWith('transit/keys/old-key');
    });
  });

  describe('getKeyInfo', () => {
    it('should get key information successfully', async () => {
      const mockKeyInfo = {
        keys: { '1': 1234567890 },
        latest_version: 1,
        min_decryption_version: 1,
        supports_encryption: true,
        supports_decryption: true,
      };

      mockVault.read.mockResolvedValue({
        data: mockKeyInfo,
      });

      const result = await vaultAdapter.getKeyInfo('test-key');

      expect(mockVault.read).toHaveBeenCalledWith('transit/keys/test-key');
      expect(result).toEqual(mockKeyInfo);
    });
  });

  describe('healthCheck', () => {
    it('should return true when Vault is healthy', async () => {
      mockVault.health.mockResolvedValue({
        initialized: true,
        sealed: false,
        standby: false,
      });

      const result = await vaultAdapter.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when Vault is sealed', async () => {
      mockVault.health.mockResolvedValue({
        initialized: true,
        sealed: true,
        standby: false,
      });

      const result = await vaultAdapter.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when health check fails', async () => {
      mockVault.health.mockRejectedValue(new Error('Connection refused'));

      const result = await vaultAdapter.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should get and set default key name', () => {
      expect(vaultAdapter.getDefaultKeyName()).toBe('test-key');

      vaultAdapter.setDefaultKeyName('new-default-key');

      expect(vaultAdapter.getDefaultKeyName()).toBe('new-default-key');
    });

    it('should get transit mount', () => {
      expect(vaultAdapter.getTransitMount()).toBe('transit');
    });

    it('should get vault client', () => {
      const client = vaultAdapter.getClient();
      expect(client).toBeDefined();
    });
  });
});
