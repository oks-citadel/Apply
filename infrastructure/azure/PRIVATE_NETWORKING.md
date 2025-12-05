# Private Networking Configuration Guide

This guide explains how to deploy and configure private networking for the JobPilot AI Platform infrastructure using Azure Private Endpoints.

## Overview

Private Endpoints provide secure, private connectivity to Azure PaaS services over a private IP address within your Virtual Network. This eliminates exposure of these services to the public internet.

### Configured Services

The following services support private endpoints:

1. **Azure Key Vault** - Secure secrets management
2. **Azure SQL Database** - Database server
3. **Azure Cache for Redis** - Caching layer
4. **Azure Storage Account** - File and blob storage (when configured)

## Architecture

### Network Topology

```
Virtual Network (10.x.0.0/16)
├── app-service-subnet (10.x.1.0/24)
│   └── App Services with VNet Integration
├── database-subnet (10.x.2.0/24)
│   └── Service Endpoints for SQL
├── cache-subnet (10.x.3.0/24)
│   └── Redis Premium VNet injection (fallback)
└── private-endpoints-subnet (10.x.4.0/24)
    ├── Key Vault Private Endpoint
    ├── SQL Database Private Endpoint
    ├── Redis Cache Private Endpoint
    └── Storage Account Private Endpoints
```

### Private DNS Zones

The following Private DNS zones are automatically created and linked to your VNet:

- `privatelink.vaultcore.azure.net` - Key Vault
- `privatelink.database.windows.net` - SQL Database
- `privatelink.redis.cache.windows.net` - Redis Cache
- `privatelink.blob.core.windows.net` - Blob Storage
- `privatelink.file.core.windows.net` - File Storage
- `privatelink.queue.core.windows.net` - Queue Storage
- `privatelink.table.core.windows.net` - Table Storage

## Deployment Options

### Development Environment

**Recommended Configuration:**
- Private Endpoints: **Disabled**
- Public Network Access: **Enabled**
- Firewall: Allow specific IPs for developer access

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters \
    environment=dev \
    sqlAdminUsername='sqladmin' \
    sqlAdminPassword='YourSecurePassword!' \
    enablePrivateEndpoints=false \
    allowedIpAddresses='["203.0.113.10","203.0.113.20"]'
```

### Staging Environment

**Recommended Configuration:**
- Private Endpoints: **Enabled** (optional)
- Public Network Access: **Enabled** with IP restrictions
- Firewall: Allow specific IPs + Azure Services

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters \
    environment=staging \
    sqlAdminUsername='sqladmin' \
    sqlAdminPassword='YourSecurePassword!' \
    enablePrivateEndpoints=true \
    allowedIpAddresses='["203.0.113.0/24"]'
```

### Production Environment

**Recommended Configuration:**
- Private Endpoints: **Enabled** (required)
- Public Network Access: **Disabled**
- Firewall: All access through private endpoints only

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters \
    environment=prod \
    sqlAdminUsername='sqladmin' \
    sqlAdminPassword='YourSecurePassword!' \
    enablePrivateEndpoints=true \
    allowedIpAddresses='[]'
```

## Parameter Reference

### enablePrivateEndpoints

**Type:** `bool`
**Default:** `false`
**Description:** Enables private endpoint deployment for all services

When enabled:
- Creates private endpoints for Key Vault, SQL Database, and Redis Cache
- Configures Private DNS zones for name resolution
- For production environments, automatically disables public network access

### allowedIpAddresses

**Type:** `array of strings`
**Default:** `[]`
**Format:** CIDR notation (e.g., `"203.0.113.10"` or `"10.0.0.0/24"`)
**Description:** IP addresses allowed to access services when public access is enabled

Example:
```json
{
  "allowedIpAddresses": [
    "203.0.113.10",      // Single IP
    "203.0.113.0/24",    // CIDR range
    "198.51.100.5"       // Another single IP
  ]
}
```

## Service-Specific Configuration

### Key Vault

#### Public Network Access Behavior

| Environment | Private Endpoints | Public Access | Network ACL Default |
|-------------|-------------------|---------------|---------------------|
| dev         | Disabled          | Enabled       | Allow (or Deny with IP list) |
| dev         | Enabled           | Enabled       | Deny with IP list |
| staging     | Disabled          | Enabled       | Allow (or Deny with IP list) |
| staging     | Enabled           | Enabled       | Deny with IP list |
| prod        | Disabled          | Enabled       | Allow (or Deny with IP list) |
| prod        | Enabled           | **Disabled**  | Deny |

#### Access Methods

1. **Private Endpoint** (Production):
   - All access through VNet
   - DNS automatically resolves to private IP
   - No public internet exposure

2. **Service Endpoints + IP Allowlist** (Dev/Staging):
   - Access from allowed IPs
   - Access from Azure services
   - Public endpoint with restrictions

### SQL Database

#### Public Network Access Behavior

| Environment | Private Endpoints | Public Access | Firewall Rules |
|-------------|-------------------|---------------|----------------|
| dev         | Disabled          | Enabled       | Azure Services + IP list |
| dev         | Enabled           | Enabled       | Azure Services + IP list |
| staging     | Disabled          | Enabled       | Azure Services + IP list |
| staging     | Enabled           | Enabled       | Azure Services + IP list |
| prod        | Disabled          | Enabled       | Azure Services + VNet rule |
| prod        | Enabled           | **Disabled**  | None (Private only) |

#### Connection Strings

When private endpoints are enabled, connection strings automatically resolve to private IPs through DNS.

**Example:**
```
Server=tcp:jobpilot-prod-sql-abc123.database.windows.net,1433;...
```

This FQDN resolves to:
- **Without Private Endpoint:** Public IP (e.g., 20.x.x.x)
- **With Private Endpoint:** Private IP (e.g., 10.0.4.5)

### Redis Cache

#### Public Network Access Behavior

| Environment | SKU     | Private Endpoints | Public Access | Subnet Injection |
|-------------|---------|-------------------|---------------|------------------|
| dev         | Basic   | N/A               | Enabled       | Not supported |
| staging     | Standard| N/A               | Enabled       | Not supported |
| prod        | Premium | Disabled          | Enabled       | Yes |
| prod        | Premium | Enabled           | **Disabled**  | No (uses PE) |

**Note:** Only Premium SKU supports both subnet injection and public network access control.

#### Access Methods

1. **Private Endpoint** (Recommended for Production):
   - Supported for all SKUs
   - Private IP address access
   - DNS-based routing

2. **VNet Injection** (Legacy Premium):
   - Only for Premium SKU
   - Directly injected into subnet
   - Used when private endpoints are disabled

## Verification and Testing

### Verify Private Endpoint Deployment

```bash
# List private endpoints
az network private-endpoint list \
  --resource-group jobpilot-prod-rg \
  --output table

# Get private endpoint details
az network private-endpoint show \
  --name jobpilot-prod-pe-keyvault \
  --resource-group jobpilot-prod-rg
```

### Verify DNS Resolution

From a VM within the VNet:

```bash
# Test Key Vault DNS resolution
nslookup jobpilot-prod-kv-abc123.vault.azure.net

# Test SQL Database DNS resolution
nslookup jobpilot-prod-sql-abc123.database.windows.net

# Test Redis Cache DNS resolution
nslookup jobpilot-prod-redis-abc123.redis.cache.windows.net
```

Expected results:
- Should resolve to private IP (10.0.4.x)
- Should NOT resolve to public IP

### Test Connectivity

From an App Service with VNet integration:

```bash
# Test Key Vault connectivity
curl https://jobpilot-prod-kv-abc123.vault.azure.net

# Test SQL Database connectivity
sqlcmd -S jobpilot-prod-sql-abc123.database.windows.net -U sqladmin -P <password>

# Test Redis connectivity
redis-cli -h jobpilot-prod-redis-abc123.redis.cache.windows.net -p 6380 -a <password> --tls
```

## Troubleshooting

### Cannot Access Services After Enabling Private Endpoints

**Symptoms:**
- Timeout when connecting to services
- DNS resolves but connection fails

**Solutions:**

1. **Verify VNet Integration:**
   ```bash
   az webapp vnet-integration list \
     --name jobpilot-prod-web \
     --resource-group jobpilot-prod-rg
   ```

2. **Check Private DNS Zone Links:**
   ```bash
   az network private-dns link vnet list \
     --resource-group jobpilot-prod-rg \
     --zone-name privatelink.vaultcore.azure.net
   ```

3. **Verify Network Security Group Rules:**
   ```bash
   az network nsg show \
     --name jobpilot-prod-nsg \
     --resource-group jobpilot-prod-rg
   ```

### DNS Resolution Issues

**Symptoms:**
- Services resolve to public IPs instead of private IPs
- Cannot resolve service names

**Solutions:**

1. **Check DNS Zone Configuration:**
   ```bash
   az network private-dns record-set a list \
     --resource-group jobpilot-prod-rg \
     --zone-name privatelink.database.windows.net
   ```

2. **Verify Private DNS Zone Group:**
   ```bash
   az network private-endpoint dns-zone-group list \
     --endpoint-name jobpilot-prod-pe-sql \
     --resource-group jobpilot-prod-rg
   ```

### Access Denied from Public Internet (Production)

**Symptoms:**
- "Forbidden" or "Access Denied" errors
- Cannot connect from local machine

**Expected Behavior:**
This is correct! Production resources should only be accessible through the VNet.

**Solutions:**

1. **For Administration:**
   - Use Azure Bastion
   - Use VPN Gateway
   - Temporarily enable public access with IP allowlist

2. **For Application Access:**
   - Ensure App Services have VNet integration enabled
   - Verify subnet delegation
   - Check NSG rules

## Security Best Practices

### 1. Production Environments

- Always enable private endpoints
- Disable public network access
- Use Azure Bastion for administrative access
- Enable Azure Defender for all services

### 2. Non-Production Environments

- Use IP allowlists for developer access
- Enable private endpoints for staging (optional)
- Keep public access enabled with restrictions
- Rotate admin credentials regularly

### 3. Network Segmentation

- Separate subnets for different tiers
- Use NSGs to control traffic flow
- Enable service endpoints as fallback
- Monitor network traffic with Network Watcher

### 4. DNS and Name Resolution

- Never hardcode IP addresses
- Always use FQDNs in connection strings
- Verify DNS resolution in each environment
- Use conditional forwarding if using custom DNS

## Cost Considerations

### Private Endpoint Costs

- **Private Endpoint:** ~$7.30/month per endpoint
- **Data Processing:** ~$0.01/GB processed

**Example Monthly Cost (Production):**
- 3 Private Endpoints (Key Vault, SQL, Redis): ~$21.90
- Data Processing (100GB/month): ~$1.00
- **Total:** ~$22.90/month

### Cost Optimization

1. **Combine Development/Staging:**
   - Use public access with IP restrictions
   - Enable private endpoints only when needed

2. **Production Only:**
   - Enable private endpoints only for production
   - Use service endpoints for lower environments

## Migration Guide

### Enabling Private Endpoints on Existing Deployment

1. **Update deployment parameters:**
   ```bash
   az deployment sub create \
     --location eastus \
     --template-file infrastructure/azure/main.bicep \
     --parameters \
       environment=prod \
       enablePrivateEndpoints=true
   ```

2. **Verify DNS resolution:**
   - Check that services resolve to private IPs
   - Test connectivity from App Services

3. **Disable public access (optional):**
   - For maximum security
   - Ensure all access paths are through VNet first

4. **Update connection strings:**
   - No changes needed (DNS handles routing)
   - Verify application connectivity

### Rolling Back Private Endpoints

1. **Disable private endpoints:**
   ```bash
   az deployment sub create \
     --location eastus \
     --template-file infrastructure/azure/main.bicep \
     --parameters \
       environment=prod \
       enablePrivateEndpoints=false
   ```

2. **Re-enable public access:**
   - Automatically handled by deployment
   - Add IP allowlist if needed

## Additional Resources

- [Azure Private Link Documentation](https://docs.microsoft.com/azure/private-link/)
- [Private Endpoints and DNS](https://docs.microsoft.com/azure/private-link/private-endpoint-dns)
- [VNet Integration for App Services](https://docs.microsoft.com/azure/app-service/web-sites-integrate-with-vnet)
- [Network Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/network-best-practices)
