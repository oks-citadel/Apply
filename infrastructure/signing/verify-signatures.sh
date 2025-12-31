#!/bin/bash
# Verify All ACR Image Signatures with Cosign
set -euo pipefail

ACR_NAME=applyforusacr
ACR_LOGIN_SERVER=applyforusacr.azurecr.io
IMAGE_PREFIX=applyai
CERT_IDENTITY="https://github.com/applyforus/*"
OIDC_ISSUER="https://token.actions.githubusercontent.com"

SERVICES=(web auth-service user-service job-service resume-service notification-service auto-apply-service analytics-service ai-service orchestrator-service payment-service)

echo "=== Cosign Signature Verification ==="
az acr login --name $ACR_NAME
TAG=${1:-latest}

for SERVICE in ${SERVICES[@]}; do
  echo -n "Verifying $IMAGE_PREFIX-$SERVICE... "
  DIGEST=$(az acr manifest show-metadata --registry $ACR_NAME --name "$IMAGE_PREFIX-$SERVICE:$TAG" --query digest -o tsv 2>/dev/null || echo "")
  if [ -n "$DIGEST" ]; then
    if cosign verify --certificate-identity-regexp="$CERT_IDENTITY" --certificate-oidc-issuer=$OIDC_ISSUER "$ACR_LOGIN_SERVER/$IMAGE_PREFIX-$SERVICE@$DIGEST" >/dev/null 2>&1; then
      echo "VERIFIED"
    else
      echo "NOT SIGNED"
    fi
  else
    echo "SKIP (not found)"
  fi
done
echo "Done!"
