# Azure Redis Cache Setup Instructions

## Overview
This document provides step-by-step instructions for creating an Azure Redis Cache instance for production and storing connection credentials in Azure Key Vault.

## Prerequisites
- Azure CLI installed and authenticated
- Access to the `applyforus-prod-rg` resource group
- Access to the `applyforus-kv` Key Vault
- Appropriate permissions to create Redis Cache instances

## Automated Setup

### Option 1: Using Bash Script (Linux/macOS/Git Bash)
```bash
cd scripts
chmod +x create-redis-production.sh
./create-redis-production.sh
```

### Option 2: Using PowerShell Script (Windows)
```powershell
cd scripts
.\create-redis-production.ps1
```

## Manual Setup

If you prefer to run commands manually, follow these steps:

### Step 1: Create the Redis Cache Instance
```bash
az redis create \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --location westus2 \
  --sku Basic \
  --vm-size c0 \
  --enable-non-ssl-port false \
  -o json
```

**Expected Output:** JSON response with Redis Cache configuration details.

**Note:** This command initiates the creation process. The actual provisioning happens asynchronously.

### Step 2: Wait for Provisioning to Complete

Monitor the provisioning state:
```bash
az redis show \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --query "provisioningState" \
  -o tsv
```

**Expected Output:**
- Initial states: `Creating`, `Updating`
- Final state: `Succeeded`

**Typical Duration:** 5-15 minutes

You can run this command repeatedly until you see `Succeeded`, or use a loop:

```bash
# Bash loop
while true; do
  STATE=$(az redis show --resource-group applyforus-prod-rg --name applyforus-redis --query "provisioningState" -o tsv)
  echo "Current state: $STATE"
  if [ "$STATE" = "Succeeded" ]; then
    echo "Provisioning complete!"
    break
  fi
  sleep 30
done
```

```powershell
# PowerShell loop
while ($true) {
  $state = az redis show --resource-group applyforus-prod-rg --name applyforus-redis --query "provisioningState" -o tsv
  Write-Host "Current state: $state"
  if ($state -eq "Succeeded") {
    Write-Host "Provisioning complete!"
    break
  }
  Start-Sleep -Seconds 30
}
```

### Step 3: Get Redis Access Keys
```bash
az redis list-keys \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  -o json
```

**Expected Output:** JSON with `primaryKey` and `secondaryKey`

### Step 4: Get Redis Hostname
```bash
az redis show \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --query "hostName" \
  -o tsv
```

**Expected Output:** `applyforus-redis.redis.cache.windows.net`

### Step 5: Store Secrets in Key Vault

First, retrieve and store the primary key in a variable:

**Bash:**
```bash
REDIS_KEY=$(az redis list-keys \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --query "primaryKey" \
  -o tsv)
```

**PowerShell:**
```powershell
$REDIS_KEY = az redis list-keys `
  --resource-group applyforus-prod-rg `
  --name applyforus-redis `
  --query "primaryKey" `
  -o tsv
```

Then store all secrets:

**Bash:**
```bash
# Store hostname
az keyvault secret set \
  --vault-name applyforus-kv \
  --name "REDIS-HOST" \
  --value "applyforus-redis.redis.cache.windows.net"

# Store port
az keyvault secret set \
  --vault-name applyforus-kv \
  --name "REDIS-PORT" \
  --value "6380"

# Store password
az keyvault secret set \
  --vault-name applyforus-kv \
  --name "REDIS-PASSWORD" \
  --value "$REDIS_KEY"

# Store TLS setting
az keyvault secret set \
  --vault-name applyforus-kv \
  --name "REDIS-TLS" \
  --value "true"

# Store connection string
az keyvault secret set \
  --vault-name applyforus-kv \
  --name "REDIS-CONNECTION-STRING" \
  --value "rediss://:$REDIS_KEY@applyforus-redis.redis.cache.windows.net:6380"
```

**PowerShell:**
```powershell
# Store hostname
az keyvault secret set `
  --vault-name applyforus-kv `
  --name "REDIS-HOST" `
  --value "applyforus-redis.redis.cache.windows.net"

# Store port
az keyvault secret set `
  --vault-name applyforus-kv `
  --name "REDIS-PORT" `
  --value "6380"

# Store password
az keyvault secret set `
  --vault-name applyforus-kv `
  --name "REDIS-PASSWORD" `
  --value $REDIS_KEY

# Store TLS setting
az keyvault secret set `
  --vault-name applyforus-kv `
  --name "REDIS-TLS" `
  --value "true"

# Store connection string
az keyvault secret set `
  --vault-name applyforus-kv `
  --name "REDIS-CONNECTION-STRING" `
  --value "rediss://:$REDIS_KEY@applyforus-redis.redis.cache.windows.net:6380"
```

### Step 6: Verify Secrets

List all Redis-related secrets in Key Vault:
```bash
az keyvault secret list \
  --vault-name applyforus-kv \
  --query "[?starts_with(name, 'REDIS')].{Name:name, Enabled:attributes.enabled, Created:attributes.created}" \
  -o table
```

## Redis Cache Configuration Details

| Setting | Value |
|---------|-------|
| **Resource Group** | applyforus-prod-rg |
| **Name** | applyforus-redis |
| **Location** | westus2 |
| **SKU** | Basic |
| **VM Size** | C0 (250 MB cache) |
| **Hostname** | applyforus-redis.redis.cache.windows.net |
| **SSL Port** | 6380 |
| **Non-SSL Port** | Disabled |
| **TLS** | Required |

## Key Vault Secrets Created

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `REDIS-HOST` | Redis hostname | `applyforus-redis.redis.cache.windows.net` |
| `REDIS-PORT` | SSL port number | `6380` |
| `REDIS-PASSWORD` | Primary access key | `<generated-key>` |
| `REDIS-TLS` | TLS enabled flag | `true` |
| `REDIS-CONNECTION-STRING` | Full connection string | `rediss://:<key>@applyforus-redis.redis.cache.windows.net:6380` |

## Testing Redis Connection

After provisioning, you can test the connection using:

### Using redis-cli
```bash
redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 -a "$REDIS_KEY" --tls
```

### Using Node.js (with ioredis)
```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: 'applyforus-redis.redis.cache.windows.net',
  port: 6380,
  password: process.env.REDIS_PASSWORD,
  tls: {
    servername: 'applyforus-redis.redis.cache.windows.net'
  }
});

redis.ping().then((result) => {
  console.log('Redis connection successful:', result);
}).catch((error) => {
  console.error('Redis connection failed:', error);
});
```

## Troubleshooting

### Provisioning Stuck
If provisioning is stuck for more than 30 minutes:
1. Check Azure Portal for any error messages
2. Verify subscription limits for Redis Cache instances
3. Try creating in a different region if westus2 has issues

### Key Vault Access Denied
If you get access denied when storing secrets:
1. Verify you have `Key Vault Secrets Officer` or `Contributor` role on the Key Vault
2. Check if Key Vault firewall rules are blocking your IP
3. Ensure the Key Vault exists and is in the correct subscription

### Connection Issues
If you can't connect to Redis after creation:
1. Verify firewall rules allow your IP address
2. Check that you're using the SSL port (6380) and TLS is enabled
3. Confirm the password is correct (use primary or secondary key)

## Cost Estimation

**Basic C0 SKU:**
- Approximate cost: $0.02/hour or ~$15/month
- Capacity: 250 MB
- Suitable for: Development, testing, small production workloads

For production workloads with higher availability requirements, consider:
- **Standard C0**: ~$30/month (includes replication)
- **Premium P1**: ~$370/month (includes clustering, persistence, VNet support)

## Next Steps

1. Update application configuration to use Key Vault references
2. Configure firewall rules to restrict access to specific IPs/VNets
3. Set up monitoring and alerts for Redis metrics
4. Consider upgrading to Standard SKU for production HA requirements
5. Implement Redis connection pooling in your applications

## Security Best Practices

1. Never commit Redis keys to source control
2. Rotate Redis keys periodically (use secondary key during rotation)
3. Use TLS/SSL for all connections (non-SSL port is disabled)
4. Restrict network access using firewall rules or Private Link
5. Enable diagnostic logging for auditing
6. Use managed identities where possible to access Key Vault

## References

- [Azure Redis Cache Documentation](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Redis CLI Documentation](https://redis.io/docs/ui/cli/)
