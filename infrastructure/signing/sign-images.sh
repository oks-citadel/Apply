#!/bin/bash
set -euo pipefail
# Sign All ACR Images
echo Signing...
ACR_NAME=applyforusacr
ACR_LOGIN_SERVER=applyforusacr.azurecr.io
IMAGE_PREFIX=applyai

SERVICES=(web auth-service user-service job-service resume-service notification-service auto-apply-service analytics-service ai-service orchestrator-service payment-service)

echo "=== Cosign Image Signing ==="
az acr login --name $ACR_NAME
TAG=${1:-latest}
for SERVICE in ${SERVICES[@]}; do
  echo "Signing $IMAGE_PREFIX-$SERVICE..."
  DIGEST=$(az acr manifest show-metadata --registry $ACR_NAME --name "$IMAGE_PREFIX-$SERVICE:$TAG" --query digest -o tsv 2>/dev/null || echo "")
  if [ -n "$DIGEST" ]; then
    cosign sign --yes --oidc-issuer=https://token.actions.githubusercontent.com "$ACR_LOGIN_SERVER/$IMAGE_PREFIX-$SERVICE@$DIGEST" && echo "OK" || echo "FAILED"
  else
    echo "SKIP (not found)"
  fi
done
echo "Done!"
