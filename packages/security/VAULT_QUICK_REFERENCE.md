# Vault KMS Quick Reference

Quick reference for using HashiCorp Vault KMS in the ApplyForUs platform.

## Quick Setup (Development)

```bash
# 1. Start Vault (Docker)
docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault:latest

# 2. Get root token
docker logs vault | grep "Root Token"

# 3. Set environment variables
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='hvs.your-root-token'

# 4. Enable transit engine
vault secrets enable transit

# 5. Create encryption key
vault write -f transit/keys/applyforus-encryption
```

## Environment Variables

```bash
VAULT_ADDR=http://127.0.0.1:8200              # Vault server address
VAULT_TOKEN=hvs.your-token                     # Authentication token
VAULT_NAMESPACE=                               # Namespace (Enterprise)
VAULT_TRANSIT_MOUNT=transit                    # Transit mount path
VAULT_DEFAULT_KEY_NAME=applyforus-encryption   # Default key name
```

## Basic Usage

### Initialize Vault Adapter

```typescript
import { VaultKMSAdapter } from '@applyforus/security';

const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
  transitMount: 'transit',
  defaultKeyName: 'applyforus-encryption',
});
```

### Encrypt Data

```typescript
const plaintext = Buffer.from('sensitive data');
const encrypted = await vaultAdapter.encrypt(plaintext, 'applyforus-encryption');
// Result: vault:v1:base64ciphertext...
```

### Decrypt Data

```typescript
const decrypted = await vaultAdapter.decrypt(encrypted, 'applyforus-encryption');
console.log(decrypted.toString()); // "sensitive data"
```

### Generate Data Key

```typescript
const { plaintext: dataKey, ciphertext: encryptedKey } =
  await vaultAdapter.generateDataKey('applyforus-encryption');

// Use dataKey for local encryption
// Store encryptedKey for later decryption
```

### Rotate Key

```typescript
await vaultAdapter.rotateKey('applyforus-encryption');
// Creates new version, old ciphertexts remain decryptable
```

## Common Commands

### Vault CLI Commands

```bash
# List keys
vault list transit/keys

# Read key info
vault read transit/keys/applyforus-encryption

# Encrypt (CLI)
echo -n "test" | base64 | vault write transit/encrypt/applyforus-encryption plaintext=-

# Decrypt (CLI)
vault write transit/decrypt/applyforus-encryption ciphertext="vault:v1:..."

# Rotate key
vault write -f transit/keys/applyforus-encryption/rotate

# Delete key (requires deletion_allowed=true)
vault write transit/keys/applyforus-encryption/config deletion_allowed=true
vault delete transit/keys/applyforus-encryption
```

## Key Management

### Create Keys for Different Purposes

```typescript
// PII encryption
await vaultAdapter.createKey('applyforus-pii', {
  type: 'aes256-gcm96',
  derivation: false,
  exportable: false,
});

// Financial data
await vaultAdapter.createKey('applyforus-financial', {
  type: 'aes256-gcm96',
  derivation: false,
  exportable: false,
});

// API credentials
await vaultAdapter.createKey('applyforus-credentials', {
  type: 'aes256-gcm96',
  derivation: false,
  exportable: false,
});
```

### Get Key Information

```typescript
const keyInfo = await vaultAdapter.getKeyInfo('applyforus-encryption');
console.log('Latest version:', keyInfo.latest_version);
console.log('Versions:', Object.keys(keyInfo.keys));
```

### Health Check

```typescript
const isHealthy = await vaultAdapter.healthCheck();
if (!isHealthy) {
  console.error('Vault is not available');
}
```

## Integration Patterns

### With KeyManager

```typescript
import { VaultKMSAdapter, KeyManager } from '@applyforus/security';

const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
});

const keyManager = new KeyManager(
  { rotationPeriodDays: 90, gracePeriodDays: 30, autoRotate: true },
  vaultAdapter
);

await keyManager.initialize();

// Use KeyManager methods
const encrypted = await keyManager.encryptWithKMS(data, keyId);
const decrypted = await keyManager.decryptWithKMS(encrypted, keyId);
```

### In NestJS Service

```typescript
import { Injectable } from '@nestjs/common';
import { VaultKMSAdapter } from '@applyforus/security';

@Injectable()
export class EncryptionService {
  private vaultAdapter: VaultKMSAdapter;

  constructor() {
    this.vaultAdapter = new VaultKMSAdapter({
      address: process.env.VAULT_ADDR!,
      token: process.env.VAULT_TOKEN!,
      defaultKeyName: 'applyforus-pii',
    });
  }

  async encryptPII(data: string): Promise<string> {
    const plaintext = Buffer.from(data);
    const encrypted = await this.vaultAdapter.encrypt(plaintext, 'applyforus-pii');
    return encrypted.toString('base64');
  }

  async decryptPII(encryptedData: string): Promise<string> {
    const ciphertext = Buffer.from(encryptedData, 'base64');
    const decrypted = await this.vaultAdapter.decrypt(ciphertext, 'applyforus-pii');
    return decrypted.toString('utf8');
  }
}
```

### Field-Level Encryption

```typescript
import { VaultKMSAdapter, FieldEncryption, KeyManager } from '@applyforus/security';

const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
});

const keyManager = new KeyManager({}, vaultAdapter);
await keyManager.initialize();

const encryption = new FieldEncryption(keyManager);

// Encrypt specific fields
const data = {
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
};

const encrypted = await encryption.encryptFields(data, ['email', 'ssn']);
// Store in database

// Decrypt when needed
const decrypted = await encryption.decryptFields(encrypted, ['email', 'ssn']);
```

## Error Handling

```typescript
try {
  const encrypted = await vaultAdapter.encrypt(data, 'my-key');
} catch (error) {
  if (error.message.includes('not found')) {
    // Key doesn't exist - create it
    await vaultAdapter.createKey('my-key');
  } else if (error.message.includes('Permission denied')) {
    // Token lacks permission - update policy
    console.error('Insufficient permissions');
  } else {
    // Other error
    console.error('Encryption failed:', error.message);
  }
}
```

## Troubleshooting

### Connection Issues

```typescript
// Test connectivity
const isHealthy = await vaultAdapter.healthCheck();
if (!isHealthy) {
  console.error('Cannot connect to Vault or Vault is sealed');
}
```

### Permission Issues

```bash
# Check token capabilities
vault token capabilities transit/encrypt/applyforus-encryption

# Update policy to grant permissions
vault policy write applyforus - <<EOF
path "transit/encrypt/applyforus-*" {
  capabilities = ["update"]
}
path "transit/decrypt/applyforus-*" {
  capabilities = ["update"]
}
EOF

# Create new token with policy
vault token create -policy=applyforus
```

### Key Not Found

```bash
# List all keys
vault list transit/keys

# Create missing key
vault write -f transit/keys/applyforus-encryption
```

## Best Practices

1. **Use Separate Keys**: Different keys for PII, financial data, credentials
2. **Regular Rotation**: Rotate keys every 90 days
3. **Least Privilege**: Grant minimum required permissions
4. **Health Checks**: Monitor Vault availability
5. **Error Handling**: Implement proper error handling and retry logic
6. **Audit Logging**: Enable Vault audit logs
7. **Secure Tokens**: Use short-lived tokens with appropriate policies
8. **Backup**: Regular backups of Vault data

## Production Configuration

### Use AppRole Authentication

```typescript
// Instead of token-based auth, use AppRole
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
});

// Login with AppRole
const response = await vault.approleLogin({
  role_id: process.env.VAULT_ROLE_ID,
  secret_id: process.env.VAULT_SECRET_ID,
});

const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: response.auth.client_token,
});
```

### High Availability

```bash
# Use load-balanced Vault cluster
VAULT_ADDR=https://vault-cluster.example.com:8200

# Enable TLS
VAULT_CACERT=/path/to/ca.crt
VAULT_CLIENT_CERT=/path/to/client.crt
VAULT_CLIENT_KEY=/path/to/client.key
```

### Token Renewal

```typescript
// Renew token periodically
setInterval(async () => {
  try {
    await vaultAdapter.getClient().tokenRenewSelf();
  } catch (error) {
    console.error('Token renewal failed:', error);
  }
}, 3600000); // Renew every hour
```

## Additional Resources

- [Full Setup Guide](./VAULT_KMS_SETUP.md)
- [Package README](./README.md)
- [Example Code](./examples/vault-kms-example.ts)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [Transit Secrets Engine](https://www.vaultproject.io/docs/secrets/transit)
