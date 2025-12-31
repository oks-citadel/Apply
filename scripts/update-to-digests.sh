test

# Update K8s Manifests to Digest-Based Images
ACR_NAME=applyforusacr
ACR_LOGIN_SERVER=applyforusacr.azurecr.io
IMAGE_PREFIX=applyai
MANIFEST_DIR=infrastructure/kubernetes/production
SERVICES=(web auth-service user-service job-service resume-service notification-service auto-apply-service analytics-service ai-service orchestrator-service payment-service)
az acr login --name $ACR_NAME
TAG=${1:-latest}
for SERVICE in ${SERVICES[@]}; do
  DIGEST=$(az acr manifest show-metadata --registry $ACR_NAME --name "$IMAGE_PREFIX-$SERVICE:$TAG" --query digest -o tsv 2>/dev/null || echo "")
  if [ -n "$DIGEST" ]; then
    echo "$SERVICE: $DIGEST"
    sed -i "s|$ACR_LOGIN_SERVER/$IMAGE_PREFIX-$SERVICE:latest|$ACR_LOGIN_SERVER/$IMAGE_PREFIX-$SERVICE@$DIGEST|g" $MANIFEST_DIR/${SERVICE}-deployment.yaml 2>/dev/null || true
  fi
done
echo Done
