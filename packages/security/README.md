# @applyforus/security

Comprehensive security package for the ApplyForUs platform, providing encryption, key management, RBAC, audit logging, and compliance features.

## Features

### Encryption & Key Management

- **Local Key Management**: Generate, rotate, and manage encryption keys locally
- **AWS KMS Integration**: Enterprise-grade key management using AWS KMS
- **HashiCorp Vault Integration**: External KMS using Vault's Transit secrets engine
- **Field-Level Encryption**: Encrypt sensitive database fields
- **Key Rotation**: Automated key rotation with grace periods

### Role-Based Access Control (RBAC)

- **Fine-grained Permissions**: Define granular permissions for resources
- **Role Management**: Create and manage roles with permission sets
- **Policy Engine**: Attribute-based access control (ABAC) policies
- **Permission Checking**: Easy-to-use permission validation

### Audit & Compliance

- **Audit Logging**: Complete audit trail of security events
- **Data Classification**: Classify data based on sensitivity
- **GDPR Compliance**: Tools for GDPR compliance (data portability, right to erasure)
- **Compliance Reporting**: Generate compliance reports

### Authentication & Authorization

- **Password Hashing**: Secure password hashing with bcrypt
- **JWT Tokens**: JSON Web Token generation and validation
- **Input Validation**: Sanitize and validate user inputs
- **XSS Protection**: Prevent cross-site scripting attacks

## Installation

```bash
pnpm add @applyforus/security
```

## Quick Start

### Key Management with AWS KMS

```typescript
import { AWSKMSAdapter, KeyManager } from '@applyforus/security';

// Create AWS KMS adapter
const kmsAdapter = new AWSKMSAdapter({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Create KeyManager
const keyManager = new KeyManager(
  {
    rotationPeriodDays: 90,
    gracePeriodDays: 30,
    autoRotate: true,
  },
  kmsAdapter
);

await keyManager.initialize();

// Encrypt data
const plaintext = Buffer.from('sensitive data');
const encrypted = await keyManager.encryptWithKMS(plaintext, process.env.AWS_KMS_KEY_ID!);

// Decrypt data
const decrypted = await keyManager.decryptWithKMS(encrypted, process.env.AWS_KMS_KEY_ID!);
```

### Key Management with HashiCorp Vault

```typescript
import { VaultKMSAdapter, KeyManager } from '@applyforus/security';

// Create Vault KMS adapter
const vaultAdapter = new VaultKMSAdapter({
  address: process.env.VAULT_ADDR!,
  token: process.env.VAULT_TOKEN!,
  transitMount: 'transit',
  defaultKeyName: 'applyforus-encryption',
});

// Create KeyManager
const keyManager = new KeyManager(
  {
    rotationPeriodDays: 90,
    gracePeriodDays: 30,
    autoRotate: true,
  },
  vaultAdapter
);

await keyManager.initialize();

// Encrypt data
const plaintext = Buffer.from('sensitive data');
const encrypted = await keyManager.encryptWithKMS(plaintext, 'applyforus-pii');

// Decrypt data
const decrypted = await keyManager.decryptWithKMS(encrypted, 'applyforus-pii');
```

### RBAC - Role-Based Access Control

```typescript
import { RBACService, Permission, Role } from '@applyforus/security';

const rbacService = new RBACService();

// Check permissions
const canEdit = rbacService.hasPermission(
  user.roles,
  Permission.APPLICATION_UPDATE,
  { ownerId: application.userId, userId: user.id }
);

if (canEdit) {
  // User can edit the application
}

// Check role
if (rbacService.hasRole(user.roles, Role.ADMIN)) {
  // User is an admin
}

// Get all permissions for user roles
const permissions = rbacService.getPermissions(user.roles);
```

### Field-Level Encryption

```typescript
import { FieldEncryption } from '@applyforus/security';

const encryption = new FieldEncryption(keyManager);

// Define encrypted fields
const sensitiveData = {
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
  salary: 75000,
};

const encryptedFields = ['email', 'ssn', 'salary'];

// Encrypt fields
const encrypted = await encryption.encryptFields(
  sensitiveData,
  encryptedFields
);

// Store encrypted data in database
await db.users.create(encrypted);

// Decrypt fields
const decrypted = await encryption.decryptFields(
  encrypted,
  encryptedFields
);
```

### Audit Logging

```typescript
import { AuditLogger, AuditEventType } from '@applyforus/security';

const auditLogger = new AuditLogger();

// Log user login
await auditLogger.log({
  eventType: AuditEventType.USER_LOGIN,
  userId: user.id,
  metadata: {
    ip: request.ip,
    userAgent: request.headers['user-agent'],
  },
});

// Log data access
await auditLogger.log({
  eventType: AuditEventType.DATA_ACCESS,
  userId: user.id,
  resourceType: 'application',
  resourceId: applicationId,
  action: 'read',
  metadata: {
    fields: ['name', 'status', 'submittedAt'],
  },
});

// Get audit trail for user
const auditTrail = await auditLogger.getAuditTrail({
  userId: user.id,
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
});
```

### Data Classification

```typescript
import { DataClassifier, DataClassification } from '@applyforus/security';

const classifier = new DataClassifier();

// Classify data
const classification = classifier.classify({
  ssn: '123-45-6789',
  email: 'john@example.com',
  name: 'John Doe',
  publicId: 'APP-12345',
});

// Check if field contains PII
if (classification.ssn === DataClassification.PII) {
  // Handle PII data with extra care
}

// Get encryption requirements
const requirements = classifier.getEncryptionRequirements({
  ssn: '123-45-6789',
  email: 'john@example.com',
});
// Returns: ['ssn', 'email'] - fields requiring encryption
```

### GDPR Compliance

```typescript
import { GDPRService } from '@applyforus/security';

const gdprService = new GDPRService();

// Export user data (Right to Data Portability)
const userData = await gdprService.exportUserData(userId);
// Returns JSON with all user data

// Anonymize user data (Right to be Forgotten)
await gdprService.anonymizeUserData(userId);
// Removes or anonymizes PII while preserving analytics

// Get consent records
const consents = await gdprService.getConsentRecords(userId);

// Record new consent
await gdprService.recordConsent({
  userId,
  consentType: 'marketing_emails',
  granted: true,
  timestamp: new Date(),
});
```

## API Reference

### Key Management

#### KeyManager

```typescript
class KeyManager {
  constructor(
    rotationPolicy?: Partial<KeyRotationPolicy>,
    externalKMS?: ExternalKMS,
    keyStorePath?: string
  );

  // Initialize the key manager
  initialize(): Promise<void>;

  // Generate a new encryption key
  generateKey(purpose?: KeyPurpose): Promise<string>;

  // Get a key by ID
  getKey(keyId: string): Buffer | null;

  // Get the active encryption key
  getActiveKey(): Buffer;

  // Get active key ID
  getActiveKeyId(): string;

  // Rotate encryption key
  rotateKey(oldKeyId?: string): Promise<string>;

  // Revoke a key
  revokeKey(keyId: string): Promise<void>;

  // Get key metadata
  getKeyMetadata(keyId: string): KeyMetadata | null;

  // List all keys
  listKeys(): KeyMetadata[];

  // Cleanup expired keys
  cleanupExpiredKeys(): Promise<number>;

  // Check if rotation is needed
  isRotationNeeded(keyId?: string): boolean;

  // Encrypt with external KMS
  encryptWithKMS(plaintext: Buffer, keyId?: string): Promise<Buffer>;

  // Decrypt with external KMS
  decryptWithKMS(ciphertext: Buffer, keyId: string): Promise<Buffer>;
}
```

#### AWSKMSAdapter

```typescript
class AWSKMSAdapter implements ExternalKMS {
  constructor(config: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  });

  // Encrypt data using AWS KMS
  encrypt(plaintext: Buffer, keyId: string): Promise<Buffer>;

  // Decrypt data using AWS KMS
  decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer>;

  // Generate a data encryption key
  generateDataKey(keyId: string): Promise<{
    plaintext: Buffer;
    ciphertext: Buffer;
  }>;

  // Rotate the KMS key
  rotateKey(keyId: string): Promise<void>;

  // Get the KMS client instance
  getClient(): KMSClient;

  // Get/Set default key ID
  getDefaultKeyId(): string;
  setDefaultKeyId(keyId: string): void;
}
```

#### VaultKMSAdapter

```typescript
class VaultKMSAdapter implements ExternalKMS {
  constructor(config: {
    address: string;
    token: string;
    namespace?: string;
    transitMount?: string;
    defaultKeyName?: string;
  });

  // Encrypt data using Vault Transit
  encrypt(plaintext: Buffer, keyId: string): Promise<Buffer>;

  // Decrypt data using Vault Transit
  decrypt(ciphertext: Buffer, keyId: string): Promise<Buffer>;

  // Generate a data encryption key
  generateDataKey(keyId: string): Promise<{
    plaintext: Buffer;
    ciphertext: Buffer;
  }>;

  // Rotate the Vault key
  rotateKey(keyId: string): Promise<void>;

  // Create a new encryption key
  createKey(
    keyName: string,
    options?: {
      type?: 'aes256-gcm96' | 'chacha20-poly1305' | 'rsa-2048' | 'rsa-4096';
      derivation?: boolean;
      exportable?: boolean;
    }
  ): Promise<void>;

  // Delete an encryption key
  deleteKey(keyName: string): Promise<void>;

  // Get key information
  getKeyInfo(keyName: string): Promise<any>;

  // Health check
  healthCheck(): Promise<boolean>;

  // Get/Set default key name
  getDefaultKeyName(): string;
  setDefaultKeyName(keyName: string): void;
  getTransitMount(): string;
}
```

### RBAC

#### RBACService

```typescript
class RBACService {
  // Check if user has permission
  hasPermission(
    userRoles: Role[],
    permission: Permission,
    context?: Record<string, any>
  ): boolean;

  // Check if user has role
  hasRole(userRoles: Role[], role: Role): boolean;

  // Get all permissions for roles
  getPermissions(roles: Role[]): Permission[];

  // Check if user has any of the specified permissions
  hasAnyPermission(
    userRoles: Role[],
    permissions: Permission[]
  ): boolean;

  // Check if user has all specified permissions
  hasAllPermissions(
    userRoles: Role[],
    permissions: Permission[]
  ): boolean;
}
```

#### Available Roles

```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
  EMPLOYER = 'employer',
  RECRUITER = 'recruiter',
  GUEST = 'guest',
}
```

#### Available Permissions

```typescript
enum Permission {
  // User permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Application permissions
  APPLICATION_CREATE = 'application:create',
  APPLICATION_READ = 'application:read',
  APPLICATION_UPDATE = 'application:update',
  APPLICATION_DELETE = 'application:delete',

  // Job permissions
  JOB_CREATE = 'job:create',
  JOB_READ = 'job:read',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',

  // And many more...
}
```

## Environment Variables

### AWS KMS Configuration

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_KMS_KEY_ID=arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012
```

### HashiCorp Vault Configuration

```bash
VAULT_ADDR=https://vault.example.com:8200
VAULT_TOKEN=hvs.your-token-here
VAULT_NAMESPACE=applyforus  # For Vault Enterprise
VAULT_TRANSIT_MOUNT=transit
VAULT_DEFAULT_KEY_NAME=applyforus-encryption
```

## Documentation

- [Vault KMS Setup Guide](./VAULT_KMS_SETUP.md) - Complete guide for HashiCorp Vault integration
- [AWS KMS Examples](./src/encryption/key-management.ts) - AWS KMS usage examples in code comments
- [RBAC Guide](./src/rbac/README.md) - Role-based access control documentation
- [Audit Logging](./src/audit/README.md) - Audit logging setup and usage

## Security Best Practices

1. **Key Rotation**: Rotate encryption keys every 90 days
2. **Principle of Least Privilege**: Grant minimum necessary permissions
3. **Audit Everything**: Enable comprehensive audit logging
4. **Use External KMS**: Use AWS KMS or Vault for production
5. **Encrypt PII**: Always encrypt personally identifiable information
6. **Monitor Access**: Set up alerts for suspicious access patterns
7. **Regular Reviews**: Review and audit permissions regularly
8. **Secure Credentials**: Never commit credentials to version control

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.
