# Azure Redis Cache Creation Script for Production
# This script creates a Redis Cache instance and stores connection info in Key Vault

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Creating Azure Redis Cache for Production" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$RESOURCE_GROUP = "applyforus-prod-rg"
$REDIS_NAME = "applyforus-redis"
$LOCATION = "westus2"
$SKU = "Basic"
$VM_SIZE = "c0"
$KEY_VAULT = "applyforus-kv"

Write-Host "Step 1: Creating Redis Cache instance..." -ForegroundColor Yellow
Write-Host "Resource Group: $RESOURCE_GROUP"
Write-Host "Redis Name: $REDIS_NAME"
Write-Host "Location: $LOCATION"
Write-Host "SKU: $SKU (VM Size: $VM_SIZE)"
Write-Host ""

$createResult = az redis create `
  --resource-group $RESOURCE_GROUP `
  --name $REDIS_NAME `
  --location $LOCATION `
  --sku $SKU `
  --vm-size $VM_SIZE `
  --enable-non-ssl-port false `
  -o json | ConvertFrom-Json

Write-Host ""
Write-Host "Step 2: Waiting for Redis provisioning to complete..." -ForegroundColor Yellow
Write-Host "This may take several minutes (typically 5-15 minutes)..." -ForegroundColor Gray
Write-Host ""

# Poll the provisioning state
$MAX_ATTEMPTS = 60  # 30 minutes max (30 seconds * 60)
$ATTEMPT = 0
$PROVISIONING_STATE = ""

while ($ATTEMPT -lt $MAX_ATTEMPTS) {
    $PROVISIONING_STATE = az redis show `
        --resource-group $RESOURCE_GROUP `
        --name $REDIS_NAME `
        --query "provisioningState" `
        -o tsv

    Write-Host "Provisioning state: $PROVISIONING_STATE (Attempt $($ATTEMPT + 1)/$MAX_ATTEMPTS)" -ForegroundColor Gray

    if ($PROVISIONING_STATE -eq "Succeeded") {
        Write-Host ""
        Write-Host "Redis Cache provisioned successfully!" -ForegroundColor Green
        break
    }
    elseif ($PROVISIONING_STATE -eq "Failed") {
        Write-Host ""
        Write-Host "ERROR: Redis provisioning failed!" -ForegroundColor Red
        exit 1
    }

    Start-Sleep -Seconds 30
    $ATTEMPT++
}

if ($ATTEMPT -eq $MAX_ATTEMPTS) {
    Write-Host ""
    Write-Host "ERROR: Provisioning timed out after 30 minutes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Retrieving Redis access keys..." -ForegroundColor Yellow
Write-Host ""

$REDIS_KEYS = az redis list-keys `
    --resource-group $RESOURCE_GROUP `
    --name $REDIS_NAME `
    -o json | ConvertFrom-Json

Write-Host "Redis keys retrieved successfully" -ForegroundColor Green
Write-Host "Primary Key Length: $($REDIS_KEYS.primaryKey.Length) characters"
Write-Host "Secondary Key Length: $($REDIS_KEYS.secondaryKey.Length) characters"

Write-Host ""
Write-Host "Step 4: Retrieving Redis hostname..." -ForegroundColor Yellow
Write-Host ""

$REDIS_HOSTNAME = az redis show `
    --resource-group $RESOURCE_GROUP `
    --name $REDIS_NAME `
    --query "hostName" `
    -o tsv

Write-Host "Redis Hostname: $REDIS_HOSTNAME" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Storing Redis connection info in Key Vault..." -ForegroundColor Yellow
Write-Host ""

# Extract primary key
$REDIS_KEY = $REDIS_KEYS.primaryKey

if ([string]::IsNullOrEmpty($REDIS_KEY)) {
    Write-Host "ERROR: Failed to retrieve primary key" -ForegroundColor Red
    exit 1
}

# Store secrets in Key Vault
Write-Host "Storing REDIS-HOST..." -ForegroundColor Gray
az keyvault secret set `
    --vault-name $KEY_VAULT `
    --name "REDIS-HOST" `
    --value $REDIS_HOSTNAME `
    -o json | Out-Null

Write-Host "Storing REDIS-PORT..." -ForegroundColor Gray
az keyvault secret set `
    --vault-name $KEY_VAULT `
    --name "REDIS-PORT" `
    --value "6380" `
    -o json | Out-Null

Write-Host "Storing REDIS-PASSWORD..." -ForegroundColor Gray
az keyvault secret set `
    --vault-name $KEY_VAULT `
    --name "REDIS-PASSWORD" `
    --value $REDIS_KEY `
    -o json | Out-Null

Write-Host "Storing REDIS-TLS..." -ForegroundColor Gray
az keyvault secret set `
    --vault-name $KEY_VAULT `
    --name "REDIS-TLS" `
    --value "true" `
    -o json | Out-Null

Write-Host "Storing REDIS-CONNECTION-STRING..." -ForegroundColor Gray
$REDIS_CONNECTION_STRING = "rediss://:$REDIS_KEY@$REDIS_HOSTNAME:6380"
az keyvault secret set `
    --vault-name $KEY_VAULT `
    --name "REDIS-CONNECTION-STRING" `
    --value $REDIS_CONNECTION_STRING `
    -o json | Out-Null

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Redis Cache Creation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Redis Configuration:" -ForegroundColor Yellow
Write-Host "  Hostname: $REDIS_HOSTNAME"
Write-Host "  Port: 6380 (SSL)"
Write-Host "  Non-SSL Port: Disabled"
Write-Host "  TLS Enabled: Yes"
Write-Host ""
Write-Host "Key Vault Secrets Stored:" -ForegroundColor Yellow
Write-Host "  - REDIS-HOST" -ForegroundColor Green
Write-Host "  - REDIS-PORT" -ForegroundColor Green
Write-Host "  - REDIS-PASSWORD" -ForegroundColor Green
Write-Host "  - REDIS-TLS" -ForegroundColor Green
Write-Host "  - REDIS-CONNECTION-STRING" -ForegroundColor Green
Write-Host ""
Write-Host "Verify secrets with:" -ForegroundColor Yellow
Write-Host "  az keyvault secret list --vault-name $KEY_VAULT --query `"[?starts_with(name, 'REDIS')].name`" -o table" -ForegroundColor Gray
Write-Host ""
