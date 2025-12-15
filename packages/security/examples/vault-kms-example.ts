/**
 * HashiCorp Vault KMS Integration Example
 *
 * This example demonstrates how to use the VaultKMSAdapter for encryption operations.
 *
 * Prerequisites:
 * 1. Install and start Vault: docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault:latest
 * 2. Get the root token: docker logs vault
 * 3. Enable transit: vault secrets enable transit
 * 4. Create a key: vault write -f transit/keys/applyforus-encryption
 * 5. Set environment variables (see below)
 */

import { VaultKMSAdapter, KeyManager } from '../src/encryption/key-management';

// ============================================================================
// Environment Configuration
// ============================================================================

// Set these environment variables before running:
// export VAULT_ADDR='http://127.0.0.1:8200'
// export VAULT_TOKEN='your-root-token'
// export VAULT_DEFAULT_KEY_NAME='applyforus-encryption'

// ============================================================================
// Example 1: Basic Encryption and Decryption
// ============================================================================

async function example1_BasicEncryption() {
  console.log('\n=== Example 1: Basic Encryption and Decryption ===\n');

  // Initialize Vault adapter
  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
    defaultKeyName: 'applyforus-encryption',
  });

  try {
    // Check Vault health
    const isHealthy = await vaultAdapter.healthCheck();
    console.log(`Vault health status: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);

    if (!isHealthy) {
      console.error('Vault is not healthy. Please check your Vault setup.');
      return;
    }

    // Encrypt some data
    const plaintext = Buffer.from('user@example.com');
    console.log(`Plaintext: ${plaintext.toString()}`);

    const encrypted = await vaultAdapter.encrypt(plaintext, 'applyforus-encryption');
    console.log(`Encrypted: ${encrypted.toString().substring(0, 50)}...`);

    // Decrypt the data
    const decrypted = await vaultAdapter.decrypt(encrypted, 'applyforus-encryption');
    console.log(`Decrypted: ${decrypted.toString()}`);

    console.log(`\nVerification: ${plaintext.toString() === decrypted.toString() ? '✓ Success' : '✗ Failed'}`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 2: Envelope Encryption with Data Keys
// ============================================================================

async function example2_EnvelopeEncryption() {
  console.log('\n=== Example 2: Envelope Encryption with Data Keys ===\n');

  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
    defaultKeyName: 'applyforus-encryption',
  });

  try {
    // Generate a data encryption key (DEK)
    console.log('Generating data encryption key...');
    const { plaintext: dataKey, ciphertext: encryptedKey } =
      await vaultAdapter.generateDataKey('applyforus-encryption');

    console.log(`Data key size: ${dataKey.length} bytes`);
    console.log(`Encrypted key: ${encryptedKey.toString().substring(0, 50)}...`);

    // Now you can use the dataKey to encrypt data locally
    // The dataKey should be used immediately and then discarded
    // Store the encryptedKey to decrypt the dataKey later when needed

    console.log('\nBenefit: The data encryption key can be used for local encryption,');
    console.log('and the master key never leaves Vault.');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 3: Key Rotation
// ============================================================================

async function example3_KeyRotation() {
  console.log('\n=== Example 3: Key Rotation ===\n');

  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
    defaultKeyName: 'applyforus-encryption',
  });

  try {
    // Get current key info
    console.log('Current key information:');
    const keyInfo = await vaultAdapter.getKeyInfo('applyforus-encryption');
    console.log(`Latest version: ${keyInfo.latest_version}`);
    console.log(`Available versions: ${Object.keys(keyInfo.keys).join(', ')}`);

    // Encrypt with current version
    const plaintext = Buffer.from('sensitive data before rotation');
    const encryptedOld = await vaultAdapter.encrypt(plaintext, 'applyforus-encryption');
    console.log(`\nEncrypted with version ${keyInfo.latest_version}`);

    // Rotate the key
    console.log('\nRotating key...');
    await vaultAdapter.rotateKey('applyforus-encryption');

    // Get updated key info
    const newKeyInfo = await vaultAdapter.getKeyInfo('applyforus-encryption');
    console.log(`New latest version: ${newKeyInfo.latest_version}`);

    // Encrypt with new version
    const encryptedNew = await vaultAdapter.encrypt(plaintext, 'applyforus-encryption');
    console.log(`Encrypted with version ${newKeyInfo.latest_version}`);

    // Old ciphertext can still be decrypted
    const decryptedOld = await vaultAdapter.decrypt(encryptedOld, 'applyforus-encryption');
    console.log(`\nDecrypted old ciphertext: ${decryptedOld.toString()}`);

    const decryptedNew = await vaultAdapter.decrypt(encryptedNew, 'applyforus-encryption');
    console.log(`Decrypted new ciphertext: ${decryptedNew.toString()}`);

    console.log('\nKey rotation complete! Old ciphertexts remain decryptable.');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 4: Integration with KeyManager
// ============================================================================

async function example4_KeyManagerIntegration() {
  console.log('\n=== Example 4: Integration with KeyManager ===\n');

  // Create Vault adapter
  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
    defaultKeyName: 'applyforus-encryption',
  });

  // Create KeyManager with Vault KMS
  const keyManager = new KeyManager(
    {
      rotationPeriodDays: 90,
      gracePeriodDays: 30,
      autoRotate: false, // Disable auto-rotation for this example
    },
    vaultAdapter
  );

  try {
    // Initialize key manager
    await keyManager.initialize();
    console.log('KeyManager initialized with Vault KMS');

    // Encrypt using KeyManager
    const plaintext = Buffer.from('data encrypted via KeyManager');
    const encrypted = await keyManager.encryptWithKMS(plaintext, 'applyforus-encryption');
    console.log(`Encrypted: ${encrypted.toString().substring(0, 50)}...`);

    // Decrypt using KeyManager
    const decrypted = await keyManager.decryptWithKMS(encrypted, 'applyforus-encryption');
    console.log(`Decrypted: ${decrypted.toString()}`);

    console.log(`\nVerification: ${plaintext.toString() === decrypted.toString() ? '✓ Success' : '✗ Failed'}`);
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 5: Key Management Operations
// ============================================================================

async function example5_KeyManagement() {
  console.log('\n=== Example 5: Key Management Operations ===\n');

  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
  });

  try {
    // Create a new key
    const newKeyName = `example-key-${Date.now()}`;
    console.log(`Creating new key: ${newKeyName}`);
    await vaultAdapter.createKey(newKeyName, {
      type: 'aes256-gcm96',
      derivation: false,
      exportable: false,
    });
    console.log('Key created successfully');

    // Get key information
    const keyInfo = await vaultAdapter.getKeyInfo(newKeyName);
    console.log('\nKey information:');
    console.log(`- Type: ${keyInfo.type}`);
    console.log(`- Supports encryption: ${keyInfo.supports_encryption}`);
    console.log(`- Supports decryption: ${keyInfo.supports_decryption}`);
    console.log(`- Latest version: ${keyInfo.latest_version}`);

    // Use the key
    const plaintext = Buffer.from('test data');
    const encrypted = await vaultAdapter.encrypt(plaintext, newKeyName);
    console.log('\nEncrypted test data successfully');

    const decrypted = await vaultAdapter.decrypt(encrypted, newKeyName);
    console.log(`Decrypted: ${decrypted.toString()}`);

    // Clean up - delete the key
    console.log(`\nDeleting key: ${newKeyName}`);
    await vaultAdapter.deleteKey(newKeyName);
    console.log('Key deleted successfully');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Example 6: Multiple Keys for Different Data Types
// ============================================================================

async function example6_MultipleKeys() {
  console.log('\n=== Example 6: Multiple Keys for Different Data Types ===\n');

  const vaultAdapter = new VaultKMSAdapter({
    address: process.env.VAULT_ADDR || 'http://127.0.0.1:8200',
    token: process.env.VAULT_TOKEN || '',
    transitMount: 'transit',
  });

  try {
    // Create separate keys for different data types
    const keys = {
      pii: 'applyforus-pii',
      financial: 'applyforus-financial',
      credentials: 'applyforus-credentials',
    };

    console.log('Creating specialized encryption keys...\n');

    for (const [type, keyName] of Object.entries(keys)) {
      try {
        await vaultAdapter.createKey(keyName, {
          type: 'aes256-gcm96',
          derivation: false,
          exportable: false,
        });
        console.log(`✓ Created key for ${type}: ${keyName}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`✓ Key for ${type} already exists: ${keyName}`);
        } else {
          throw error;
        }
      }
    }

    // Encrypt different types of data with appropriate keys
    console.log('\nEncrypting different data types:');

    const piiData = Buffer.from('john.doe@example.com');
    const encryptedPII = await vaultAdapter.encrypt(piiData, keys.pii);
    console.log(`✓ PII encrypted with ${keys.pii}`);

    const financialData = Buffer.from('$150,000');
    const encryptedFinancial = await vaultAdapter.encrypt(financialData, keys.financial);
    console.log(`✓ Financial data encrypted with ${keys.financial}`);

    const credentialData = Buffer.from('api-key-secret-12345');
    const encryptedCredential = await vaultAdapter.encrypt(credentialData, keys.credentials);
    console.log(`✓ Credentials encrypted with ${keys.credentials}`);

    // Decrypt
    console.log('\nDecrypting data:');
    const decryptedPII = await vaultAdapter.decrypt(encryptedPII, keys.pii);
    console.log(`✓ PII: ${decryptedPII.toString()}`);

    const decryptedFinancial = await vaultAdapter.decrypt(encryptedFinancial, keys.financial);
    console.log(`✓ Financial: ${decryptedFinancial.toString()}`);

    const decryptedCredential = await vaultAdapter.decrypt(encryptedCredential, keys.credentials);
    console.log(`✓ Credentials: ${decryptedCredential.toString()}`);

    console.log('\nBenefit: Separate keys for different data types provide better security');
    console.log('and allow for granular access control and audit trails.');
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================================================
// Run All Examples
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  HashiCorp Vault KMS Integration Examples                     ║');
  console.log('║  ApplyForUs Platform - Security Package                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Check environment variables
  if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
    console.error('\n❌ Error: Required environment variables not set!');
    console.log('\nPlease set the following:');
    console.log('  export VAULT_ADDR="http://127.0.0.1:8200"');
    console.log('  export VAULT_TOKEN="your-root-token"');
    console.log('\nSee VAULT_KMS_SETUP.md for complete setup instructions.');
    process.exit(1);
  }

  try {
    await example1_BasicEncryption();
    await example2_EnvelopeEncryption();
    await example3_KeyRotation();
    await example4_KeyManagerIntegration();
    await example5_KeyManagement();
    await example6_MultipleKeys();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ All examples completed successfully!                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  } catch (error: any) {
    console.error('\n❌ Error running examples:', error.message);
    console.error('\nPlease ensure:');
    console.error('  1. Vault is running and accessible');
    console.error('  2. Transit secrets engine is enabled');
    console.error('  3. Required keys are created');
    console.error('  4. Environment variables are set correctly');
    console.error('\nSee VAULT_KMS_SETUP.md for troubleshooting.');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_BasicEncryption,
  example2_EnvelopeEncryption,
  example3_KeyRotation,
  example4_KeyManagerIntegration,
  example5_KeyManagement,
  example6_MultipleKeys,
};
