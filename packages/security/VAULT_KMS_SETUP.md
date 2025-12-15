# HashiCorp Vault KMS Integration Guide

This guide explains how to set up and use the VaultKMSAdapter for external key management with HashiCorp Vault's Transit secrets engine.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Vault Setup](#vault-setup)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Overview

The VaultKMSAdapter provides production-ready integration with HashiCorp Vault's Transit secrets engine for:

- **Encryption/Decryption**: Encrypt and decrypt data using Vault-managed keys
- **Data Key Generation**: Generate data encryption keys (DEKs) with envelope encryption
- **Key Rotation**: Seamlessly rotate encryption keys without re-encrypting existing data
- **Key Management**: Create, configure, and manage encryption keys in Vault

### Why Use Vault KMS?

- **Centralized Key Management**: Store and manage all encryption keys in one secure location
- **Audit Trail**: Complete audit log of all encryption operations
- **Compliance**: Meet regulatory requirements (GDPR, HIPAA, PCI-DSS)
- **Zero-Trust Security**: Keys never leave Vault's secure environment
- **Automatic Key Rotation**: Built-in support for key versioning and rotation

## Prerequisites

### 1. Install HashiCorp Vault

**Option A: Docker (Development)**
```bash
# Run Vault in dev mode (NOT for production)
docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault:latest

# Get the root token
docker logs vault
```

**Option B: Binary Installation (Production)**
```bash
# Download and install Vault
wget https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
unzip vault_1.15.0_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Verify installation
vault version
```

### 2. Install node-vault Package

The VaultKMSAdapter requires the `node-vault` package, which is already added to the `@applyforus/security` package dependencies:

```bash
# Install dependencies
cd packages/security
pnpm install
```

## Vault Setup

### Step 1: Enable Transit Secrets Engine

```bash
# Set Vault address and token
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='your-root-token'

# Enable transit secrets engine
vault secrets enable transit
```

### Step 2: Create Encryption Keys

```bash
# Create a key for general encryption
vault write -f transit/keys/applyforus-encryption

# Create a key for PII encryption
vault write -f transit/keys/applyforus-pii type=aes256-gcm96

# Create a key with custom configuration
vault write transit/keys/applyforus-master \
  type=aes256-gcm96 \
  derived=false \
  exportable=false
```

### Step 3: Create a Policy for Application Access

Create a policy file `applyforus-policy.hcl`:

```hcl
# Policy for ApplyForUs application
path "transit/encrypt/applyforus-*" {
  capabilities = ["update"]
}

path "transit/decrypt/applyforus-*" {
  capabilities = ["update"]
}

path "transit/datakey/plaintext/applyforus-*" {
  capabilities = ["update"]
}

path "transit/keys/applyforus-*" {
  capabilities = ["read"]
}

path "transit/keys/applyforus-*/rotate" {
  capabilities = ["update"]
}

path "transit/keys/applyforus-*/config" {
  capabilities = ["update"]
}

path "sys/health" {
  capabilities = ["read"]
}
```

Apply the policy:

```bash
# Create the policy
vault policy write applyforus applyforus-policy.hcl

# Create a token with the policy
vault token create -policy=applyforus -period=24h
```

### Step 4: Configure Environment Variables

```bash
# For development (.env.local)
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=hvs.your-token-here
VAULT_NAMESPACE=  # Leave empty for OSS Vault
VAULT_TRANSIT_MOUNT=transit
VAULT_DEFAULT_KEY_NAME=applyforus-encryption

# For production (use secrets management)
VAULT_ADDR=https://vault.production.example.com:8200
VAULT_TOKEN=${VAULT_TOKEN}  # Injected from secrets manager
VAULT_NAMESPACE=applyforus  # For Vault Enterprise
VAULT_TRANSIT_MOUNT=transit
VAULT_DEFAULT_KEY_NAME=applyforus-encryption
```

## Configuration

### Basic Configuration

```typescript
import { VaultKMSAdapter } from '@applyforus/security';

// Using environment variables
const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
});

// With explicit configuration
const vaultAdapter = new VaultKMSAdapter({
  address: 'https://vault.production.example.com:8200',
  token: 'hvs.your-token-here',
  namespace: 'applyforus',  // For Vault Enterprise
  transitMount: 'transit',
  defaultKeyName: 'applyforus-encryption',
});
```

### Integration with KeyManager

```typescript
import { VaultKMSAdapter, KeyManager } from '@applyforus/security';

// Create Vault adapter
const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
  transitMount: 'transit',
  defaultKeyName: 'applyforus-encryption',
});

// Create KeyManager with Vault KMS
const keyManager = new KeyManager(
  {
    rotationPeriodDays: 90,
    gracePeriodDays: 30,
    autoRotate: true,
  },
  vaultAdapter
);

await keyManager.initialize();
```

## Usage Examples

### 1. Encrypt and Decrypt Data

```typescript
import { VaultKMSAdapter } from '@applyforus/security';

const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
});

// Encrypt sensitive data
const plaintext = Buffer.from('user@example.com');
const encrypted = await vaultAdapter.encrypt(plaintext, 'applyforus-pii');

console.log('Encrypted:', encrypted.toString());
// Output: vault:v1:base64encodedciphertext...

// Decrypt data
const decrypted = await vaultAdapter.decrypt(encrypted, 'applyforus-pii');

console.log('Decrypted:', decrypted.toString());
// Output: user@example.com
```

### 2. Generate Data Encryption Keys (Envelope Encryption)

```typescript
// Generate a data encryption key (DEK)
const { plaintext: dataKey, ciphertext: encryptedKey } =
  await vaultAdapter.generateDataKey('applyforus-master');

// Use the plaintext key to encrypt data locally
import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, dataKey, iv);

let encrypted = cipher.update('sensitive data', 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// Store: encryptedKey (from Vault), iv, authTag, encrypted data
// The dataKey never needs to be stored - it can be decrypted from encryptedKey

// To decrypt later:
const decryptedKeyResponse = await vaultAdapter.decrypt(
  encryptedKey,
  'applyforus-master'
);
// Use decryptedKeyResponse to decrypt the data
```

### 3. Rotate Encryption Keys

```typescript
// Rotate a key (creates a new version)
await vaultAdapter.rotateKey('applyforus-encryption');

// After rotation:
// - New encryptions use the latest version
// - Old ciphertexts can still be decrypted using their version
// - No need to re-encrypt existing data immediately
```

### 4. Key Management Operations

```typescript
// Create a new encryption key
await vaultAdapter.createKey('applyforus-customer-data', {
  type: 'aes256-gcm96',
  derivation: false,
  exportable: false,
});

// Get key information
const keyInfo = await vaultAdapter.getKeyInfo('applyforus-encryption');
console.log('Key versions:', Object.keys(keyInfo.keys));
console.log('Latest version:', keyInfo.latest_version);
console.log('Min decryption version:', keyInfo.min_decryption_version);

// Health check
const isHealthy = await vaultAdapter.healthCheck();
if (!isHealthy) {
  console.error('Vault is not healthy!');
}

// Delete a key (be careful!)
// Note: Key must be configured with deletion_allowed=true
await vaultAdapter.deleteKey('applyforus-old-key');
```

### 5. Using with KeyManager

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

// Encrypt with KMS
const plaintext = Buffer.from('sensitive data');
const encrypted = await keyManager.encryptWithKMS(plaintext, 'applyforus-encryption');

// Decrypt with KMS
const decrypted = await keyManager.decryptWithKMS(encrypted, 'applyforus-encryption');
```

### 6. Use in NestJS Service

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
    const encrypted = await this.vaultAdapter.encrypt(
      plaintext,
      'applyforus-pii'
    );
    return encrypted.toString('base64');
  }

  async decryptPII(encryptedData: string): Promise<string> {
    const ciphertext = Buffer.from(encryptedData, 'base64');
    const decrypted = await this.vaultAdapter.decrypt(
      ciphertext,
      'applyforus-pii'
    );
    return decrypted.toString('utf8');
  }
}
```

## Production Deployment

### 1. Use Vault Enterprise (Recommended)

For production, use Vault Enterprise with:
- **Namespaces**: Isolate environments and teams
- **Performance Replication**: High availability
- **HSM Auto-Unseal**: Secure key management
- **Sentinel Policies**: Fine-grained access control

### 2. Authentication Methods

Instead of tokens, use more secure authentication methods:

**AppRole Authentication:**
```bash
# Enable AppRole
vault auth enable approle

# Create role
vault write auth/approle/role/applyforus \
  token_policies="applyforus" \
  token_ttl=1h \
  token_max_ttl=4h

# Get role ID and secret ID
vault read auth/approle/role/applyforus/role-id
vault write -f auth/approle/role/applyforus/secret-id
```

**Kubernetes Authentication:**
```bash
# Enable Kubernetes auth
vault auth enable kubernetes

# Configure Kubernetes auth
vault write auth/kubernetes/config \
  kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443"

# Create role
vault write auth/kubernetes/role/applyforus \
  bound_service_account_names=applyforus \
  bound_service_account_namespaces=production \
  policies=applyforus \
  ttl=24h
```

### 3. High Availability Setup

```hcl
# vault.hcl
storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/etc/vault/tls/tls.crt"
  tls_key_file  = "/etc/vault/tls/tls.key"
}

seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "your-kms-key-id"
}

api_addr = "https://vault.example.com:8200"
cluster_addr = "https://vault.example.com:8201"
ui = true
```

### 4. Monitoring and Alerting

```bash
# Enable telemetry
vault write sys/metrics/config \
  enabled=true \
  prometheus_retention_time="30s"

# Monitor key operations
curl -H "X-Vault-Token: $VAULT_TOKEN" \
  http://127.0.0.1:8200/v1/sys/metrics
```

### 5. Key Rotation Policy

Implement automated key rotation:

```bash
# Create a script for regular rotation
#!/bin/bash
KEYS=("applyforus-encryption" "applyforus-pii" "applyforus-master")

for key in "${KEYS[@]}"; do
  echo "Rotating key: $key"
  vault write -f transit/keys/$key/rotate
done
```

Add to cron:
```bash
# Rotate keys monthly
0 0 1 * * /usr/local/bin/rotate-vault-keys.sh
```

### 6. Backup and Recovery

```bash
# Take a Vault snapshot (Enterprise)
vault operator raft snapshot save backup.snap

# Restore from snapshot
vault operator raft snapshot restore backup.snap
```

## Troubleshooting

### Error: "Permission denied"

**Cause**: Token doesn't have required permissions

**Solution**:
```bash
# Check token capabilities
vault token capabilities transit/encrypt/applyforus-encryption

# Verify policy
vault policy read applyforus

# Create new token with correct policy
vault token create -policy=applyforus
```

### Error: "Key not found"

**Cause**: Encryption key doesn't exist in Vault

**Solution**:
```bash
# List existing keys
vault list transit/keys

# Create the key
vault write -f transit/keys/applyforus-encryption
```

### Error: "Connection refused"

**Cause**: Vault server is not running or address is incorrect

**Solution**:
```bash
# Check Vault status
vault status

# Verify VAULT_ADDR
echo $VAULT_ADDR

# Check connectivity
curl -k $VAULT_ADDR/v1/sys/health
```

### Error: "Vault is sealed"

**Cause**: Vault needs to be unsealed

**Solution**:
```bash
# Unseal Vault (requires unseal keys)
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>
```

### Performance Issues

**Symptoms**: Slow encryption/decryption operations

**Solutions**:
1. Enable connection pooling in node-vault
2. Use batch encryption for multiple values
3. Implement caching for frequently decrypted values
4. Use Vault Performance Standby nodes
5. Monitor Vault metrics for bottlenecks

### Debugging Tips

```typescript
// Enable verbose logging
const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
});

// All operations log to console with [Vault KMS] prefix
// Check logs for detailed error messages and operation details
```

## Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VAULT_ADDR` | Vault server address | Yes | `http://127.0.0.1:8200` | `https://vault.example.com:8200` |
| `VAULT_TOKEN` | Authentication token | Yes | - | `hvs.CAESIKqz...` |
| `VAULT_NAMESPACE` | Vault Enterprise namespace | No | - | `applyforus` |
| `VAULT_TRANSIT_MOUNT` | Transit engine mount path | No | `transit` | `encryption` |
| `VAULT_DEFAULT_KEY_NAME` | Default encryption key name | No | - | `applyforus-encryption` |

## Best Practices

1. **Key Naming Convention**: Use prefixes to organize keys (e.g., `applyforus-{purpose}`)
2. **Regular Rotation**: Rotate keys every 90 days minimum
3. **Principle of Least Privilege**: Grant only necessary permissions
4. **Monitor Operations**: Set up alerts for failed encryption operations
5. **Use Namespaces**: Isolate environments using Vault Enterprise namespaces
6. **Backup Tokens**: Store recovery tokens securely offline
7. **Enable Audit Logs**: Track all encryption operations
8. **Test Recovery**: Regularly test disaster recovery procedures

## Additional Resources

- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [Transit Secrets Engine](https://www.vaultproject.io/docs/secrets/transit)
- [Vault Production Hardening](https://learn.hashicorp.com/tutorials/vault/production-hardening)
- [node-vault GitHub](https://github.com/nodevault/node-vault)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vault audit logs for detailed error information
3. Consult HashiCorp Vault documentation
4. Contact the ApplyForUs security team
