# Azure Container Registry Build Instructions

## Issue: Windows Path Length Limitation

The `az acr build` command is failing due to Windows path length limitations in the `apps/mobile/node_modules` directory. The specific error:

```
ERROR: [WinError 3] The system cannot find the path specified: '.\\apps\\mobile\\node_modules\\react-native-reanimated\\android\\src\\reactNativeVersionPatch\\ReanimatedNativeHierarchyManager\\75\\com\\swmansion\\reanimated\\layoutReanimation\\ReanimatedNativeHierarchyManagerBase.java'
```

## Current Status

### Images Already in ACR with v3.0.0:
- `applyai-job-service:v3.0.0` ✅ (Already exists)

### Images Needing v3.0.0:
- `applyai-web` (currently at v2.6.0)
- `applyai-auth-service` (currently at v2.2.0)
- `applyai-user-service` (currently at v2.2.0)
- `applyai-analytics-service` (currently at v2.1.0)
- `applyai-api-gateway` (does not exist yet)

## Solution Options

### Option 1: Clean node_modules (Recommended)

Remove problematic node_modules directories before building:

```powershell
# Run in PowerShell
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform

# Remove problematic node_modules
Remove-Item -Path "apps\mobile\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\admin\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\employer\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\extension\node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Set UTF-8 encoding
$env:PYTHONIOENCODING = "utf-8"

# Build services one by one
az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile .
az acr build --registry applyforusacr --image applyai-auth-service:v3.0.0 --image applyai-auth-service:latest --file services/auth-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-user-service:v3.0.0 --image applyai-user-service:latest --file services/user-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-analytics-service:v3.0.0 --image applyai-analytics-service:latest --file services/analytics-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-api-gateway:v3.0.0 --image applyai-api-gateway:latest --file services/api-gateway/Dockerfile .
```

### Option 2: Use the PowerShell Script

Execute the provided PowerShell script:

```powershell
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
powershell.exe -ExecutionPolicy Bypass -File "build-acr.ps1"
```

### Option 3: Use WSL (Windows Subsystem for Linux)

If WSL is available, use it to avoid Windows path limitations:

```bash
wsl
cd /mnt/c/Users/kogun/OneDrive/Documents/Job-Apply-Platform

# Build services
az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile .
az acr build --registry applyforusacr --image applyai-auth-service:v3.0.0 --image applyai-auth-service:latest --file services/auth-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-user-service:v3.0.0 --image applyai-user-service:latest --file services/user-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-analytics-service:v3.0.0 --image applyai-analytics-service:latest --file services/analytics-service/Dockerfile .
az acr build --registry applyforusacr --image applyai-api-gateway:v3.0.0 --image applyai-api-gateway:latest --file services/api-gateway/Dockerfile .
```

### Option 4: Use Git Archive

Create a clean source tarball using only git-tracked files:

```bash
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
git archive --format=tar HEAD | gzip > source.tar.gz

# Then build from the tarball
az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile source.tar.gz
```

### Option 5: Use Azure DevOps Pipeline

Create an Azure DevOps pipeline that runs in a Linux agent to avoid Windows path limitations. See `.azuredevops/pipelines/build-images.yml` for reference.

## Verification

After building, verify the images:

```bash
# List all repositories
az acr repository list --name applyforusacr --output table

# Check tags for each service
az acr repository show-tags --name applyforusacr --repository applyai-web --output table
az acr repository show-tags --name applyforusacr --repository applyai-auth-service --output table
az acr repository show-tags --name applyforusacr --repository applyai-user-service --output table
az acr repository show-tags --name applyforusacr --repository applyai-job-service --output table
az acr repository show-tags --name applyforusacr --repository applyai-analytics-service --output table
az acr repository show-tags --name applyforusacr --repository applyai-api-gateway --output table
```

## Files Created

1. `build-acr.sh` - Bash script for building all services
2. `build-acr.ps1` - PowerShell script for building all services
3. `.azbuildignore` - Azure build ignore file to exclude problematic directories

## Notes

- The `.dockerignore` file already excludes `apps/mobile/`, `apps/admin/`, etc., but `az acr build` still tries to pack them
- The issue is specific to Windows due to path length limitations (MAX_PATH = 260 characters)
- WSL or Linux builds should work without issues
- Consider enabling long path support in Windows: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`
