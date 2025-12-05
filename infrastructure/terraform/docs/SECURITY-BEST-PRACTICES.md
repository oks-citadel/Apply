# Security Best Practices for Terraform on Azure DevOps

Comprehensive security guide for Terraform infrastructure deployment on Azure DevOps, covering state file security, secret management, access control, and compliance.

## Table of Contents

- [Security Principles](#security-principles)
- [State File Security](#state-file-security)
- [Secret Management](#secret-management)
- [Access Control and RBAC](#access-control-and-rbac)
- [Network Security](#network-security)
- [Pipeline Security](#pipeline-security)
- [Compliance and Audit](#compliance-and-audit)
- [Incident Response](#incident-response)
- [Security Scanning](#security-scanning)
- [Backup and Recovery](#backup-and-recovery)

## Security Principles

### Defense in Depth

Implement multiple layers of security controls:

```
Layer 1: Identity & Access Management
Layer 2: Network Security
Layer 3: Data Encryption
Layer 4: Application Security
Layer 5: Monitoring & Detection
Layer 6: Incident Response
```

### Zero Trust Model

**Core Principles:**
- Never trust, always verify
- Assume breach
- Least privilege access
- Explicit verification
- Microsegmentation

### Security by Design

- Security requirements from day one
- Threat modeling during design
- Security controls in code
- Automated security testing
- Regular security reviews

## State File Security

Terraform state files contain sensitive information including:
- Resource IDs and configurations
- IP addresses and network topology
- Secrets (if not properly managed)
- Infrastructure relationships

### 1. Secure State Storage

**Use Azure Storage with Security Features:**

```bash
# Create storage account with maximum security
STORAGE_ACCOUNT="jobpilottfstate$(date +%s)"
RESOURCE_GROUP="jobpilot-terraform-state-rg"

az storage account create \
  --name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --location eastus \
  --sku Standard_GRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --allow-shared-key-access false \
  --default-action Deny \
  --bypass AzureServices \
  --encryption-services blob file \
  --encryption-key-source Microsoft.Storage
```

### 2. Enable State File Encryption

**Customer-Managed Keys (CMK):**

```bash
# Create Key Vault
az keyvault create \
  --name jobpilot-tfstate-kv \
  --resource-group ${RESOURCE_GROUP} \
  --location eastus \
  --enable-purge-protection true \
  --enable-soft-delete true

# Create encryption key
az keyvault key create \
  --vault-name jobpilot-tfstate-kv \
  --name terraform-state-key \
  --protection software \
  --size 2048

# Enable CMK encryption
KEY_URI=$(az keyvault key show \
  --vault-name jobpilot-tfstate-kv \
  --name terraform-state-key \
  --query key.kid -o tsv)

az storage account update \
  --name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --encryption-key-source Microsoft.Keyvault \
  --encryption-key-vault ${KEY_URI}
```

### 3. State File Versioning and Soft Delete

```bash
# Enable blob versioning
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --enable-versioning true

# Enable soft delete (30 days)
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --enable-delete-retention true \
  --delete-retention-days 30

# Enable point-in-time restore
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --enable-restore-policy true \
  --restore-days 29
```

### 4. Network Restrictions

```bash
# Deny all traffic by default
az storage account update \
  --name ${STORAGE_ACCOUNT} \
  --default-action Deny

# Allow Azure services
az storage account update \
  --name ${STORAGE_ACCOUNT} \
  --bypass AzureServices

# Allow specific Azure DevOps IP ranges
DEVOPS_IP_RANGES=(
  "13.107.6.0/24"
  "13.107.9.0/24"
  "13.107.42.0/24"
  "13.107.43.0/24"
)

for IP_RANGE in "${DEVOPS_IP_RANGES[@]}"; do
  az storage account network-rule add \
    --account-name ${STORAGE_ACCOUNT} \
    --ip-address ${IP_RANGE}
done

# Allow your management IPs
MY_IP=$(curl -s https://api.ipify.org)
az storage account network-rule add \
  --account-name ${STORAGE_ACCOUNT} \
  --ip-address ${MY_IP}
```

### 5. State Locking

**Prevent concurrent modifications:**

```hcl
# backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "jobpilot-terraform-state-rg"
    storage_account_name = "jobpilottfstate"
    container_name       = "tfstate"
    key                  = "prod.tfstate"

    # Enable state locking
    use_azuread_auth     = true
    use_microsoft_graph  = true
  }
}
```

### 6. State File Access Logging

```bash
# Enable diagnostic logging
LOG_ANALYTICS_ID="/subscriptions/${SUB_ID}/resourceGroups/${RG}/providers/Microsoft.OperationalInsights/workspaces/${WORKSPACE}"

az monitor diagnostic-settings create \
  --name state-access-logs \
  --resource "/subscriptions/${SUB_ID}/resourceGroups/${RG}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT}" \
  --logs '[
    {
      "category": "StorageRead",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 90}
    },
    {
      "category": "StorageWrite",
      "enabled": true,
      "retentionPolicy": {"enabled": true, "days": 90}
    }
  ]' \
  --workspace ${LOG_ANALYTICS_ID}
```

### 7. Sensitive Data in State

**Never store secrets directly:**

```hcl
# BAD - Secret in state
resource "azurerm_key_vault_secret" "example" {
  name         = "db-password"
  value        = "MyPassword123!"  # Will be in state file!
  key_vault_id = azurerm_key_vault.example.id
}

# GOOD - Reference existing secret
data "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  key_vault_id = var.key_vault_id
}

# GOOD - Generate and store
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.db_password.result
  key_vault_id = azurerm_key_vault.example.id

  lifecycle {
    ignore_changes = [value]  # Don't update in state
  }
}
```

### 8. State File Backup

```bash
#!/bin/bash
# backup-tfstate.sh - Run daily

STORAGE_ACCOUNT="jobpilottfstate"
CONTAINER="tfstate"
BACKUP_CONTAINER="tfstate-backups"
DATE=$(date +%Y%m%d-%H%M%S)

# List all state files
STATE_FILES=$(az storage blob list \
  --account-name ${STORAGE_ACCOUNT} \
  --container-name ${CONTAINER} \
  --query "[].name" -o tsv)

# Backup each state file
for STATE_FILE in ${STATE_FILES}; do
  BACKUP_NAME="${STATE_FILE}-${DATE}"

  az storage blob copy start \
    --account-name ${STORAGE_ACCOUNT} \
    --destination-container ${BACKUP_CONTAINER} \
    --destination-blob ${BACKUP_NAME} \
    --source-container ${CONTAINER} \
    --source-blob ${STATE_FILE}
done

echo "Backup completed: ${DATE}"
```

## Secret Management

### 1. Azure Key Vault Integration

**Architecture:**

```
Terraform → Azure Key Vault → Secrets
    ↓
Application reads secrets directly from Key Vault
(Not from Terraform state)
```

**Implementation:**

```hcl
# Create Key Vault
resource "azurerm_key_vault" "main" {
  name                = "jobpilot-${var.environment}-kv"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "premium"  # HSM-backed keys

  # Network security
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"

    ip_rules = var.allowed_ips

    virtual_network_subnet_ids = [
      azurerm_subnet.aks.id
    ]
  }

  # Security features
  enabled_for_deployment          = false
  enabled_for_disk_encryption     = true
  enabled_for_template_deployment = true
  enable_rbac_authorization       = true
  purge_protection_enabled        = true
  soft_delete_retention_days      = 90

  # Logging
  tags = {
    Environment = var.environment
    Purpose     = "secret-management"
  }
}

# Don't store secret values in Terraform
# Instead, reference them
data "azurerm_key_vault_secret" "db_password" {
  name         = "database-password"
  key_vault_id = azurerm_key_vault.main.id
}

# Use the secret reference (not the value)
resource "azurerm_postgresql_server" "main" {
  name                = "jobpilot-${var.environment}-db"
  # ... other config ...

  administrator_login_password = data.azurerm_key_vault_secret.db_password.value
}
```

### 2. Secret Rotation

**Automated rotation strategy:**

```hcl
# Store secret with metadata
resource "azurerm_key_vault_secret" "db_password" {
  name         = "database-password"
  value        = random_password.db_password.result
  key_vault_id = azurerm_key_vault.main.id

  tags = {
    RotationSchedule = "90days"
    LastRotated     = timestamp()
    RotatedBy       = "terraform"
  }

  lifecycle {
    ignore_changes = [value]
  }
}
```

**Rotation script:**

```bash
#!/bin/bash
# rotate-secrets.sh

SECRET_NAME="database-password"
KEY_VAULT="jobpilot-prod-kv"

# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update application (graceful)
# 1. Add new secret as secondary
az keyvault secret set \
  --vault-name ${KEY_VAULT} \
  --name "${SECRET_NAME}-new" \
  --value "${NEW_PASSWORD}"

# 2. Update application to use new secret
# (deployment or config update)

# 3. Wait for propagation
sleep 300

# 4. Replace old secret
az keyvault secret set \
  --vault-name ${KEY_VAULT} \
  --name "${SECRET_NAME}" \
  --value "${NEW_PASSWORD}"

# 5. Remove temporary secret
az keyvault secret delete \
  --vault-name ${KEY_VAULT} \
  --name "${SECRET_NAME}-new"

echo "Secret rotated successfully"
```

### 3. Pipeline Secret Management

**In Azure DevOps:**

```yaml
# azure-pipelines-terraform.yml
variables:
  - group: terraform-backend  # From Key Vault

steps:
  # Never echo secrets
  - script: |
      # BAD
      echo "Password: $(ARM_CLIENT_SECRET)"

      # GOOD
      echo "##vso[task.setvariable variable=MY_SECRET;issecret=true]$(ARM_CLIENT_SECRET)"
    displayName: 'Handle Secrets Safely'

  # Use secrets in secure context
  - task: AzureCLI@2
    inputs:
      azureSubscription: 'azure-terraform-connection'
      scriptType: bash
      scriptLocation: inlineScript
      inlineScript: |
        # Secrets available as environment variables
        terraform apply -auto-approve
    env:
      ARM_CLIENT_SECRET: $(ARM_CLIENT_SECRET)
      TF_VAR_db_password: $(DB_PASSWORD)
```

### 4. Secret Detection

**Pre-commit hook:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Detect secrets in code
if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --verbose
  if [ $? -ne 0 ]; then
    echo "❌ Secret detected! Commit blocked."
    exit 1
  fi
fi

# Detect high-entropy strings
if command -v trufflehog &> /dev/null; then
  trufflehog filesystem . --only-verified
  if [ $? -ne 0 ]; then
    echo "❌ Potential secret detected! Commit blocked."
    exit 1
  fi
fi

echo "✅ No secrets detected"
exit 0
```

**In Pipeline:**

```yaml
- script: |
    # Install gitleaks
    wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
    tar -xzf gitleaks_8.18.0_linux_x64.tar.gz

    # Scan for secrets
    ./gitleaks detect --source . --verbose --report-format json --report-path gitleaks-report.json
  displayName: 'Detect Secrets'

- task: PublishBuildArtifacts@1
  condition: failed()
  inputs:
    pathToPublish: 'gitleaks-report.json'
    artifactName: 'secret-scan-results'
```

## Access Control and RBAC

### 1. Service Principal Least Privilege

**Custom role definition:**

```json
{
  "Name": "Terraform Deployer",
  "Description": "Minimal permissions for Terraform infrastructure deployment",
  "Actions": [
    "Microsoft.Resources/subscriptions/resourceGroups/*",
    "Microsoft.Network/virtualNetworks/*",
    "Microsoft.Network/networkSecurityGroups/*",
    "Microsoft.Compute/virtualMachines/*",
    "Microsoft.Storage/storageAccounts/*",
    "Microsoft.ContainerRegistry/registries/*",
    "Microsoft.ContainerService/managedClusters/*",
    "Microsoft.KeyVault/vaults/*",
    "Microsoft.Insights/components/*",
    "Microsoft.OperationalInsights/workspaces/*"
  ],
  "NotActions": [
    "Microsoft.Authorization/*/Delete",
    "Microsoft.Authorization/*/Write"
  ],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jobpilot-*"
  ]
}
```

### 2. Azure DevOps Permissions

**Project-level:**

```yaml
Project Administrators:
  - DevOps Team Lead
  - CTO

Build Administrators:
  - DevOps Engineers
  - Senior Developers

Contributors:
  - Developers (read-only)

Pipeline Permissions:
  dev environment: All developers
  staging environment: Senior developers
  prod environment: DevOps team only
```

**Variable Group Permissions:**

```yaml
terraform-backend:
  Administrators: DevOps Team
  Users: Build Service Account
  Readers: No one (secrets)

terraform-dev:
  Administrators: DevOps Team
  Users: All developers
  Readers: Project members

terraform-prod:
  Administrators: DevOps Team, CTO
  Users: Build Service Account
  Readers: DevOps Team
```

### 3. Environment Protection

**Configuration:**

```yaml
Environment: prod

RBAC:
  Administrators:
    - DevOps Team
    - Engineering Manager

  Approvers:
    - Tech Lead
    - Engineering Manager

  Creators:
    - DevOps Team only

  Users:
    - Build Service (pipeline execution)

Checks:
  - Approval: Required (2 approvers)
  - Branch Control: main only
  - Business Hours: Mon-Fri 9AM-5PM
```

### 4. Resource-Level RBAC

```hcl
# Assign roles via Terraform
resource "azurerm_role_assignment" "aks_admin" {
  scope                = azurerm_kubernetes_cluster.main.id
  role_definition_name = "Azure Kubernetes Service Cluster Admin Role"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

# Key Vault access policy
resource "azurerm_key_vault_access_policy" "aks" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
```

## Network Security

### 1. Private Endpoints

```hcl
# Storage account with private endpoint
resource "azurerm_storage_account" "main" {
  name                     = "jobpilot${var.environment}sa"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"

  # Disable public access
  public_network_access_enabled = false

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }
}

# Private endpoint for storage
resource "azurerm_private_endpoint" "storage" {
  name                = "jobpilot-storage-pe"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "storage-connection"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "storage-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage.id]
  }
}
```

### 2. Network Segmentation

```hcl
# Virtual network with security zones
resource "azurerm_virtual_network" "main" {
  name                = "jobpilot-${var.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
}

# Application subnet
resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]

  service_endpoints = ["Microsoft.KeyVault", "Microsoft.Storage"]
}

# Database subnet
resource "azurerm_subnet" "data" {
  name                 = "data-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "db-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
    }
  }
}

# Management subnet
resource "azurerm_subnet" "mgmt" {
  name                 = "management-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.3.0/24"]
}
```

### 3. Network Security Groups

```hcl
# NSG for application subnet
resource "azurerm_network_security_group" "app" {
  name                = "app-nsg"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name

  # Deny all inbound by default
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow HTTPS from internet
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  # Allow from management subnet
  security_rule {
    name                       = "AllowManagement"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.3.0/24"
    destination_address_prefix = "*"
  }
}

# Associate NSG with subnet
resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}
```

### 4. Azure Firewall

```hcl
# Azure Firewall for egress control
resource "azurerm_firewall" "main" {
  name                = "jobpilot-${var.environment}-fw"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "AZFW_VNet"
  sku_tier            = "Premium"  # Includes TLS inspection

  ip_configuration {
    name                 = "configuration"
    subnet_id            = azurerm_subnet.firewall.id
    public_ip_address_id = azurerm_public_ip.firewall.id
  }
}

# Firewall rules
resource "azurerm_firewall_policy" "main" {
  name                = "jobpilot-fw-policy"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location

  threat_intelligence_mode = "Alert"

  intrusion_detection {
    mode = "Alert"
  }

  dns {
    proxy_enabled = true
  }
}

resource "azurerm_firewall_policy_rule_collection_group" "main" {
  name               = "app-rules"
  firewall_policy_id = azurerm_firewall_policy.main.id
  priority           = 100

  application_rule_collection {
    name     = "allow-external-apis"
    priority = 100
    action   = "Allow"

    rule {
      name = "allow-openai"
      source_addresses = ["10.0.0.0/16"]
      destination_fqdns = ["api.openai.com"]
      protocols {
        type = "Https"
        port = 443
      }
    }
  }

  network_rule_collection {
    name     = "deny-all"
    priority = 4096
    action   = "Deny"

    rule {
      name                  = "deny-internet"
      protocols             = ["Any"]
      source_addresses      = ["10.0.0.0/16"]
      destination_addresses = ["*"]
      destination_ports     = ["*"]
    }
  }
}
```

## Pipeline Security

### 1. Secure Pipeline Configuration

```yaml
# azure-pipelines-terraform.yml

# Disable forked repository builds
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - infrastructure/terraform/**

# Disable PR builds from forks
pr:
  branches:
    include:
      - main
  autoCancel: true

# Resource access restrictions
resources:
  repositories:
    - repository: templates
      type: git
      name: infrastructure-templates
      ref: main

variables:
  - group: terraform-backend
  - name: TF_IN_AUTOMATION
    value: 'true'
  - name: TF_INPUT
    value: 'false'

stages:
  - stage: SecurityScan
    displayName: 'Security Scanning'
    jobs:
      - job: StaticAnalysis
        displayName: 'Static Security Analysis'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          # Scan for secrets
          - script: |
              docker run --rm -v $(Build.SourcesDirectory):/src zricethezav/gitleaks:latest detect --source /src --verbose
            displayName: 'Detect Secrets'

          # Terraform security scan
          - script: |
              docker run --rm -v $(Build.SourcesDirectory):/src aquasec/tfsec:latest /src
            displayName: 'TFSec Scan'

          # Policy as code
          - script: |
              docker run --rm -v $(Build.SourcesDirectory):/src bridgecrew/checkov:latest -d /src --framework terraform
            displayName: 'Checkov Scan'

          # Fail pipeline on high-severity issues
          - script: |
              if [ -f tfsec-results.json ]; then
                HIGH_SEVERITY=$(jq '[.results[] | select(.severity=="HIGH")] | length' tfsec-results.json)
                if [ $HIGH_SEVERITY -gt 0 ]; then
                  echo "❌ $HIGH_SEVERITY high-severity issues found!"
                  exit 1
                fi
              fi
            displayName: 'Validate Security Results'
```

### 2. Build Agent Security

**Use Microsoft-hosted agents (recommended):**

```yaml
pool:
  vmImage: 'ubuntu-latest'  # Fresh VM per build
```

**Or secure self-hosted agents:**

```yaml
pool:
  name: 'secure-agent-pool'
  demands:
    - agent.os -equals Linux
    - security-hardened -equals true

# Agent security checklist:
# ☑ Isolated network
# ☑ Minimal installed software
# ☑ Auto-updates enabled
# ☑ Monitoring and logging
# ☑ Regular security scans
# ☑ Ephemeral (destroyed after use)
```

### 3. Pipeline Permissions

```yaml
# Restrict pipeline permissions
Settings → Pipeline permissions:
  ☐ Grant access to all pipelines
  ☑ Require approval for first use
  ☑ Limit job authorization scope
  ☑ Protect access to repositories
```

### 4. Code Signing

```yaml
- task: DownloadSecureFile@1
  name: CodeSigningCert
  inputs:
    secureFile: 'code-signing.pfx'

- script: |
    # Sign Terraform configurations
    gpg --import $(CodeSigningCert.secureFilePath)
    find . -name "*.tf" -exec gpg --detach-sign --armor {} \;
  displayName: 'Sign Terraform Configs'
```

## Compliance and Audit

### 1. Compliance Frameworks

**Implement controls for:**
- SOC 2
- ISO 27001
- HIPAA
- PCI DSS
- GDPR

**Example: PCI DSS Controls**

```hcl
# Requirement 1: Firewall protection
resource "azurerm_network_security_group" "pci" {
  # ... NSG configuration ...
}

# Requirement 2: Change default passwords
resource "random_password" "admin" {
  length  = 16
  special = true

  lifecycle {
    create_before_destroy = true
  }
}

# Requirement 3: Encrypt stored data
resource "azurerm_storage_account" "pci" {
  # ... storage config ...

  encryption {
    services {
      blob {
        enabled = true
      }
      file {
        enabled = true
      }
    }
    key_source = "Microsoft.Keyvault"
  }
}

# Requirement 4: Encrypt data in transit
resource "azurerm_storage_account" "pci" {
  https_only     = true
  min_tls_version = "TLS1_2"
}

# Requirement 10: Log and monitor
resource "azurerm_monitor_diagnostic_setting" "pci" {
  # ... diagnostic settings ...
}
```

### 2. Audit Logging

**Enable comprehensive logging:**

```hcl
# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "audit" {
  name                = "jobpilot-audit-logs"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 730  # 2 years for compliance

  tags = {
    Purpose = "audit-compliance"
  }
}

# Diagnostic settings for all resources
resource "azurerm_monitor_diagnostic_setting" "all" {
  for_each = {
    aks     = azurerm_kubernetes_cluster.main.id
    keyvault = azurerm_key_vault.main.id
    storage = azurerm_storage_account.main.id
  }

  name               = "${each.key}-diagnostics"
  target_resource_id = each.value
  log_analytics_workspace_id = azurerm_log_analytics_workspace.audit.id

  enabled_log {
    category = "AuditEvent"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
```

### 3. Immutable Infrastructure

```hcl
# Prevent modifications to production resources
resource "azurerm_management_lock" "prod" {
  count      = var.environment == "prod" ? 1 : 0
  name       = "production-lock"
  scope      = azurerm_resource_group.main.id
  lock_level = "CanNotDelete"
  notes      = "Production resources protected from deletion"
}
```

### 4. Change Tracking

```bash
# Track all infrastructure changes
git log --all --oneline --decorate --graph infrastructure/terraform/

# Export for audit
git log \
  --since="2025-01-01" \
  --until="2025-12-31" \
  --format="%H|%an|%ae|%ad|%s" \
  --date=iso \
  infrastructure/terraform/ > infrastructure-changes-2025.csv
```

## Incident Response

### 1. Security Incident Playbook

```markdown
# Security Incident Response Plan

## Phase 1: Detection (0-15 minutes)
1. Alert received (Azure Security Center, monitoring)
2. Initial assessment
3. Determine severity: P1 (critical), P2 (high), P3 (medium)
4. Page on-call security engineer

## Phase 2: Containment (15-60 minutes)
1. Isolate affected resources
2. Revoke compromised credentials
3. Block malicious IPs
4. Snapshot affected systems for forensics

## Phase 3: Eradication (1-4 hours)
1. Remove malicious code/access
2. Patch vulnerabilities
3. Reset all credentials
4. Rebuild compromised systems

## Phase 4: Recovery (4-24 hours)
1. Restore from clean backups
2. Verify system integrity
3. Gradually restore services
4. Monitor for reinfection

## Phase 5: Post-Incident (24-72 hours)
1. Conduct root cause analysis
2. Document lessons learned
3. Update security controls
4. Notify stakeholders/authorities if required
```

### 2. Automated Response

```bash
# automated-response.sh
#!/bin/bash

INCIDENT_TYPE=$1
RESOURCE_ID=$2

case $INCIDENT_TYPE in
  "compromised-credential")
    # Disable service principal
    az ad sp update --id ${RESOURCE_ID} --set accountEnabled=false

    # Revoke all sessions
    az ad sp credential reset --id ${RESOURCE_ID}

    # Alert team
    curl -X POST ${TEAMS_WEBHOOK} -d '{"text":"🚨 Credential compromised and disabled: '${RESOURCE_ID}'"}'
    ;;

  "suspicious-activity")
    # Enable additional logging
    az monitor diagnostic-settings update \
      --resource ${RESOURCE_ID} \
      --set logs[0].enabled=true \
      --set logs[0].category=AuditLogs

    # Snapshot for forensics
    az snapshot create \
      --resource-group forensics-rg \
      --source ${RESOURCE_ID} \
      --name "incident-$(date +%s)"
    ;;

  "malware-detected")
    # Isolate network
    az network nsg rule create \
      --resource-group ${RG} \
      --nsg-name ${NSG} \
      --name quarantine \
      --priority 100 \
      --direction Inbound \
      --access Deny \
      --source-address-prefixes '*'

    # Alert security team
    # ... notification logic ...
    ;;
esac
```

### 3. Credential Revocation

```bash
# emergency-credential-rotation.sh
#!/bin/bash

echo "🚨 EMERGENCY CREDENTIAL ROTATION"
echo "================================"

# 1. Rotate Service Principal
SP_NAME="jobpilot-terraform-sp"
NEW_SECRET=$(az ad sp credential reset --name ${SP_NAME} --query password -o tsv)

# 2. Update Key Vault
az keyvault secret set \
  --vault-name jobpilot-kv \
  --name "ARM-CLIENT-SECRET" \
  --value "${NEW_SECRET}"

# 3. Update Azure DevOps (manual step - requires UI)
echo "⚠️  Manual step required:"
echo "Update service connection 'azure-terraform-connection' with new secret"
echo "New secret: ${NEW_SECRET}"

# 4. Revoke all storage account keys
STORAGE_ACCOUNTS=$(az storage account list --query "[].name" -o tsv)
for SA in ${STORAGE_ACCOUNTS}; do
  az storage account keys renew --account-name ${SA} --key primary
  az storage account keys renew --account-name ${SA} --key secondary
done

# 5. Restart affected services
az aks restart --name jobpilot-prod-aks --resource-group jobpilot-prod-rg

echo "✅ Credential rotation complete"
echo "📧 Notify team of changes"
```

## Security Scanning

### 1. Static Analysis

**TFSec Configuration:**

```yaml
# .tfsec.yml
minimum_severity: MEDIUM

exclude:
  - AVD-AZU-0033  # Specific exclusion with justification

custom_checks:
  - name: enforce-tags
    description: All resources must have required tags
    type: tags
    required_tags:
      - Environment
      - Owner
      - CostCenter
```

**Checkov Configuration:**

```yaml
# .checkov.yml
framework: terraform

skip-check:
  - CKV_AZURE_1  # Excluded with documented exception

custom-policy-dir: ./security-policies/
```

### 2. Dynamic Scanning

```yaml
- script: |
    # Deploy to test environment
    terraform apply -auto-approve

    # Wait for services to start
    sleep 60

    # Run OWASP ZAP
    docker run --rm -v $(pwd):/zap/wrk/:rw \
      owasp/zap2docker-stable zap-baseline.py \
      -t https://test.jobpilot.ai \
      -r zap-report.html
  displayName: 'Dynamic Security Test'
```

### 3. Dependency Scanning

```yaml
- script: |
    # Scan Terraform modules
    terraform-compliance -f compliance-tests/ -p plan.json

    # Check for known vulnerabilities
    terrascan scan -i terraform -d .
  displayName: 'Dependency Security Scan'
```

## Backup and Recovery

### 1. Backup Strategy

**3-2-1 Rule:**
- 3 copies of data
- 2 different storage media
- 1 offsite backup

```bash
# Backup script
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d)

# 1. Terraform state
az storage blob download-batch \
  --destination ./backups/tfstate-${BACKUP_DATE} \
  --source tfstate \
  --account-name jobpilottfstate

# 2. Configuration files
tar -czf backups/config-${BACKUP_DATE}.tar.gz infrastructure/

# 3. Secrets inventory (not values!)
az keyvault secret list \
  --vault-name jobpilot-prod-kv \
  --query "[].{name:name,updated:attributes.updated}" \
  --output json > backups/secrets-inventory-${BACKUP_DATE}.json

# 4. Upload to secondary location
az storage blob upload-batch \
  --destination backups \
  --source ./backups/ \
  --account-name jobpilotbackups \
  --account-key ${BACKUP_KEY}

# 5. Encrypt and upload to cold storage
tar -czf - backups/ | \
  gpg --encrypt --recipient ops@jobpilot.ai | \
  aws s3 cp - s3://jobpilot-cold-backups/backup-${BACKUP_DATE}.tar.gz.gpg
```

### 2. Disaster Recovery

**Recovery Time Objective (RTO): 4 hours**
**Recovery Point Objective (RPO): 1 hour**

```bash
#!/bin/bash
# disaster-recovery.sh

echo "Starting Disaster Recovery Process"

# 1. Restore state files
az storage blob download-batch \
  --destination ./terraform-state-restore \
  --source tfstate \
  --account-name jobpilotbackups \
  --pattern "*.tfstate"

# 2. Initialize Terraform
cd infrastructure/terraform
terraform init \
  -backend-config="storage_account_name=jobpilotbackups"

# 3. Import existing resources (if partial failure)
terraform import azurerm_resource_group.main /subscriptions/${SUB}/resourceGroups/jobpilot-prod-rg

# 4. Recreate infrastructure
terraform plan -out=recovery.tfplan
terraform apply recovery.tfplan

# 5. Restore application data
# ... application-specific restoration ...

# 6. Verify services
curl -f https://api.jobpilot.ai/health

echo "✅ Disaster recovery complete"
```

## Additional Resources

- [Main Setup Guide](./AZURE-DEVOPS-SETUP.md)
- [Variable Groups Guide](./VARIABLE-GROUPS.md)
- [Service Connections Guide](./SERVICE-CONNECTIONS.md)
- [Environments Guide](./ENVIRONMENTS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)
- [Terraform Security Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html#security)

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** Security Team & DevOps Team
**Review Schedule:** Quarterly
