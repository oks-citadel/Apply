# Azure Container Registry Build Summary

## Date: 2025-12-19

## Objective
Build and push Docker images for all services to Azure Container Registry (applyforusacr) with version tags v3.0.0 and latest.

## Critical Issue Encountered

**Windows Path Length Limitation Error:**
```
ERROR: [WinError 3] The system cannot find the path specified:
'.\\apps\\mobile\\node_modules\\react-native-reanimated\\android\\src\\reactNativeVersionPatch\\
ReanimatedNativeHierarchyManager\\75\\com\\swmansion\\reanimated\\layoutReanimation\\
ReanimatedNativeHierarchyManagerBase.java'
```

**Root Cause:**
- The `az acr build` command packs the entire source directory into a tarball before uploading to Azure
- Windows has a 260-character path length limitation (MAX_PATH)
- The mobile app's node_modules contains symlinks to deeply nested paths that exceed this limit
- Even though `.dockerignore` excludes these directories, `az acr build` still tries to traverse them during the packing phase

## Current Status in ACR

### ✅ Already Built with v3.0.0:
1. **applyai-job-service:v3.0.0** - Successfully built

### ⚠️ Need v3.0.0 (Currently have older versions):
1. **applyai-web** - Current: v2.6.0, Need: v3.0.0
2. **applyai-auth-service** - Current: v2.2.0, Need: v3.0.0
3. **applyai-user-service** - Current: v2.2.0, Need: v3.0.0
4. **applyai-analytics-service** - Current: v2.1.0, Need: v3.0.0

### ❌ Do Not Exist Yet:
1. **applyai-api-gateway** - Needs to be created with v3.0.0

## Solution Implemented

Created three helper files in the project root:

### 1. `.azbuildignore`
Azure build ignore file (though az acr build doesn't natively support this)

### 2. `build-acr.sh` (Bash Script)
Full build script for Bash/Linux environments:
- Removes problematic node_modules directories
- Builds all 5 core services + api-gateway
- Tags with both v3.0.0 and latest
- Shows build summary

### 3. `build-acr.ps1` (PowerShell Script)
Full build script for PowerShell/Windows environments:
- Removes problematic node_modules directories using PowerShell commands
- Sets PYTHONIOENCODING to utf-8 to avoid encoding issues
- Builds all services with proper error handling
- Color-coded output and build summary

## Recommended Solutions

### Quick Fix (Recommended - Manual)

Run these commands in PowerShell as Administrator:

```powershell
# Navigate to project
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform

# Remove problematic node_modules
Remove-Item -Path "apps\mobile\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\admin\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\employer\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\extension\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Set encoding
$env:PYTHONIOENCODING = "utf-8"

# Build each service
az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile .

az acr build --registry applyforusacr --image applyai-auth-service:v3.0.0 --image applyai-auth-service:latest --file services/auth-service/Dockerfile .

az acr build --registry applyforusacr --image applyai-user-service:v3.0.0 --image applyai-user-service:latest --file services/user-service/Dockerfile .

az acr build --registry applyforusacr --image applyai-analytics-service:v3.0.0 --image applyai-analytics-service:latest --file services/analytics-service/Dockerfile .

az acr build --registry applyforusacr --image applyai-api-gateway:v3.0.0 --image applyai-api-gateway:latest --file services/api-gateway/Dockerfile .
```

### Alternative 1: Use PowerShell Script

```powershell
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
powershell.exe -ExecutionPolicy Bypass -File "build-acr.ps1"
```

### Alternative 2: Use WSL (Windows Subsystem for Linux)

If WSL is installed:

```bash
wsl
cd /mnt/c/Users/kogun/OneDrive/Documents/Job-Apply-Platform
chmod +x build-acr.sh
./build-acr.sh
```

### Alternative 3: Use Git Bash

```bash
cd /c/Users/kogun/OneDrive/Documents/Job-Apply-Platform
bash build-acr.sh
```

### Alternative 4: Azure DevOps Pipeline

Use the Azure DevOps pipeline which runs on Linux agents (no path limitations):
- Pipeline file: `.azuredevops/pipelines/docker-build.yml`
- Trigger manually or via commit

### Alternative 5: Enable Windows Long Paths

Enable long path support in Windows (requires admin and reboot):

1. Run as Administrator:
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

2. Reboot Windows

3. Run the build commands

## Service Details

### 1. Web Service (apps/web)
- **Dockerfile:** `apps/web/Dockerfile`
- **Current Tag:** v2.6.0
- **Target Tag:** v3.0.0
- **Framework:** Next.js 14
- **Port:** 3000
- **Dependencies:** @applyforus/types, @applyforus/security, @applyforus/shared, @applyforus/telemetry

### 2. Auth Service (services/auth-service)
- **Dockerfile:** `services/auth-service/Dockerfile`
- **Current Tag:** v2.2.0
- **Target Tag:** v3.0.0
- **Framework:** Node.js/NestJS
- **Port:** 8081
- **Dependencies:** Workspace packages

### 3. User Service (services/user-service)
- **Dockerfile:** `services/user-service/Dockerfile`
- **Current Tag:** v2.2.0
- **Target Tag:** v3.0.0
- **Framework:** Node.js/NestJS
- **Port:** 8082
- **Dependencies:** Workspace packages

### 4. Job Service (services/job-service)
- **Dockerfile:** `services/job-service/Dockerfile`
- **Current Tag:** v3.0.0 ✅
- **Status:** Already built and tagged
- **Framework:** Node.js/NestJS
- **Port:** 8083

### 5. Analytics Service (services/analytics-service)
- **Dockerfile:** `services/analytics-service/Dockerfile`
- **Current Tag:** v2.1.0
- **Target Tag:** v3.0.0
- **Framework:** Node.js/NestJS
- **Port:** 8085
- **Dependencies:** Workspace packages

### 6. API Gateway (services/api-gateway)
- **Dockerfile:** `services/api-gateway/Dockerfile`
- **Current Tag:** N/A (doesn't exist)
- **Target Tag:** v3.0.0
- **Framework:** Node.js/NestJS
- **Port:** 8080
- **Status:** New service

## Build Time Estimates

Based on previous successful builds:
- Each service build: ~4-5 minutes
- Total for 5 services: ~20-25 minutes
- Parallel builds could reduce to ~10-15 minutes if resources allow

## Post-Build Verification

After building, verify images exist:

```bash
# List all repositories
az acr repository list --name applyforusacr --output table

# Verify each service has v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-web --output table | grep v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-auth-service --output table | grep v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-user-service --output table | grep v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-job-service --output table | grep v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-analytics-service --output table | grep v3.0.0
az acr repository show-tags --name applyforusacr --repository applyai-api-gateway --output table | grep v3.0.0
```

## Additional Notes

1. **Monorepo Structure:** All Dockerfiles require the full monorepo context (packages/, services/, apps/)
2. **PNPM Workspaces:** Builds use pnpm@8.15.0 with workspace dependencies
3. **Multi-stage Builds:** All services use multi-stage Docker builds (builder → production)
4. **Security:** Images use pinned base image digests and non-root users
5. **Health Checks:** All services include Docker healthcheck configurations

## Troubleshooting

### If builds still fail after removing node_modules:

1. Check if any background node processes are holding locks:
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

2. Clear pnpm cache:
   ```powershell
   pnpm store prune
   ```

3. Try building from a shorter path:
   ```powershell
   # Create junction to shorter path
   mklink /J C:\build C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
   cd C:\build
   # Run builds from here
   ```

4. Use Docker Desktop build (if installed):
   ```bash
   docker build -t applyforusacr.azurecr.io/applyai-web:v3.0.0 -f apps/web/Dockerfile .
   docker push applyforusacr.azurecr.io/applyai-web:v3.0.0
   ```

## Next Steps

1. Choose one of the recommended solutions above
2. Execute the build commands
3. Verify all images are in ACR with v3.0.0 tags
4. Update Kubernetes manifests to use v3.0.0 images
5. Deploy to AKS cluster

## Files Created

- ✅ `.azbuildignore` - Azure build ignore patterns
- ✅ `build-acr.sh` - Bash build script
- ✅ `build-acr.ps1` - PowerShell build script
- ✅ `ACR_BUILD_INSTRUCTIONS.md` - Detailed instructions
- ✅ `ACR_BUILD_SUMMARY.md` - This summary document
