test

# Azure Container Registry Policies

## Registry Info
- Name: applyforusacr
- Server: applyforusacr.azurecr.io
- SKU: Premium

## Enable Tag Immutability
az acr config content-trust update --registry applyforusacr --status Enabled

## Enable Retention Policy
az acr config retention update --registry applyforusacr --type UntaggedManifests --days 7 --status Enabled

## Network Security
az acr update --name applyforusacr --public-network-enabled false

## Authentication
az role assignment create --assignee <aks-mi> --scope <acr-id> --role AcrPull
az role assignment create --assignee <cicd-sp> --scope <acr-id> --role AcrPush

## Image Naming
Format: applyforusacr.azurecr.io/applyai-<service>:<tag>
Production use digest: applyforusacr.azurecr.io/applyai-<service>@sha256:...

## Vulnerability Scanning
az security pricing create --name Containers --tier Standard

## Maintenance
az acr run --registry applyforusacr --cmd "acr purge --filter applyai-*:dev-* --ago 14d" /dev/null
