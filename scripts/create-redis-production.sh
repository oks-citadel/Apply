#!/bin/bash

# Azure Redis Cache Creation Script for Production
# This script creates a Redis Cache instance and stores connection info in Key Vault

set -e  # Exit on any error

echo "================================================"
echo "Creating Azure Redis Cache for Production"
echo "================================================"
echo ""

# Configuration
RESOURCE_GROUP="applyforus-prod-rg"
REDIS_NAME="applyforus-redis"
LOCATION="westus2"
SKU="Basic"
VM_SIZE="c0"
KEY_VAULT="applyforus-kv"

echo "Step 1: Creating Redis Cache instance..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Redis Name: $REDIS_NAME"
echo "Location: $LOCATION"
echo "SKU: $SKU (VM Size: $VM_SIZE)"
echo ""

az redis create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$REDIS_NAME" \
  --location "$LOCATION" \
  --sku "$SKU" \
  --vm-size "$VM_SIZE" \
  --enable-non-ssl-port false \
  -o json

echo ""
echo "Step 2: Waiting for Redis provisioning to complete..."
echo "This may take several minutes (typically 5-15 minutes)..."
echo ""

# Poll the provisioning state
MAX_ATTEMPTS=60  # 30 minutes max (30 seconds * 60)
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  PROVISIONING_STATE=$(az redis show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REDIS_NAME" \
    --query "provisioningState" \
    -o tsv)

  echo "Provisioning state: $PROVISIONING_STATE (Attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"

  if [ "$PROVISIONING_STATE" = "Succeeded" ]; then
    echo ""
    echo "Redis Cache provisioned successfully!"
    break
  elif [ "$PROVISIONING_STATE" = "Failed" ]; then
    echo ""
    echo "ERROR: Redis provisioning failed!"
    exit 1
  fi

  sleep 30
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo ""
  echo "ERROR: Provisioning timed out after 30 minutes"
  exit 1
fi

echo ""
echo "Step 3: Retrieving Redis access keys..."
echo ""

REDIS_KEYS=$(az redis list-keys \
  --resource-group "$RESOURCE_GROUP" \
  --name "$REDIS_NAME" \
  -o json)

echo "Redis keys retrieved successfully"
echo "$REDIS_KEYS" | jq '.'

echo ""
echo "Step 4: Retrieving Redis hostname..."
echo ""

REDIS_HOSTNAME=$(az redis show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$REDIS_NAME" \
  --query "hostName" \
  -o tsv)

echo "Redis Hostname: $REDIS_HOSTNAME"

echo ""
echo "Step 5: Storing Redis connection info in Key Vault..."
echo ""

# Extract primary key
REDIS_KEY=$(echo "$REDIS_KEYS" | jq -r '.primaryKey')

if [ -z "$REDIS_KEY" ] || [ "$REDIS_KEY" = "null" ]; then
  echo "ERROR: Failed to retrieve primary key"
  exit 1
fi

# Store secrets in Key Vault
echo "Storing REDIS-HOST..."
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "REDIS-HOST" \
  --value "$REDIS_HOSTNAME" \
  -o json > /dev/null

echo "Storing REDIS-PORT..."
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "REDIS-PORT" \
  --value "6380" \
  -o json > /dev/null

echo "Storing REDIS-PASSWORD..."
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "REDIS-PASSWORD" \
  --value "$REDIS_KEY" \
  -o json > /dev/null

echo "Storing REDIS-TLS..."
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "REDIS-TLS" \
  --value "true" \
  -o json > /dev/null

echo "Storing REDIS-CONNECTION-STRING..."
REDIS_CONNECTION_STRING="rediss://:$REDIS_KEY@$REDIS_HOSTNAME:6380"
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "REDIS-CONNECTION-STRING" \
  --value "$REDIS_CONNECTION_STRING" \
  -o json > /dev/null

echo ""
echo "================================================"
echo "Redis Cache Creation Complete!"
echo "================================================"
echo ""
echo "Redis Configuration:"
echo "  Hostname: $REDIS_HOSTNAME"
echo "  Port: 6380 (SSL)"
echo "  Non-SSL Port: Disabled"
echo "  TLS Enabled: Yes"
echo ""
echo "Key Vault Secrets Stored:"
echo "  - REDIS-HOST"
echo "  - REDIS-PORT"
echo "  - REDIS-PASSWORD"
echo "  - REDIS-TLS"
echo "  - REDIS-CONNECTION-STRING"
echo ""
echo "Verify secrets with:"
echo "  az keyvault secret list --vault-name $KEY_VAULT --query \"[?starts_with(name, 'REDIS')].name\" -o table"
echo ""
