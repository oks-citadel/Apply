# Quick Build Commands

## One-Click Solution (PowerShell)

Open PowerShell as Administrator and run:

```powershell
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform; Remove-Item -Path "apps\mobile\node_modules","apps\admin\node_modules","apps\employer\node_modules","apps\extension\node_modules" -Recurse -Force -ErrorAction SilentlyContinue; $env:PYTHONIOENCODING="utf-8"; az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile .; az acr build --registry applyforusacr --image applyai-auth-service:v3.0.0 --image applyai-auth-service:latest --file services/auth-service/Dockerfile .; az acr build --registry applyforusacr --image applyai-user-service:v3.0.0 --image applyai-user-service:latest --file services/user-service/Dockerfile .; az acr build --registry applyforusacr --image applyai-analytics-service:v3.0.0 --image applyai-analytics-service:latest --file services/analytics-service/Dockerfile .; az acr build --registry applyforusacr --image applyai-api-gateway:v3.0.0 --image applyai-api-gateway:latest --file services/api-gateway/Dockerfile .
```

## Individual Service Builds

First, clean node_modules:
```powershell
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
Remove-Item -Path "apps\mobile\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\admin\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\employer\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps\extension\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING="utf-8"
```

Then build each service:

### Web Service
```powershell
az acr build --registry applyforusacr --image applyai-web:v3.0.0 --image applyai-web:latest --file apps/web/Dockerfile .
```

### Auth Service
```powershell
az acr build --registry applyforusacr --image applyai-auth-service:v3.0.0 --image applyai-auth-service:latest --file services/auth-service/Dockerfile .
```

### User Service
```powershell
az acr build --registry applyforusacr --image applyai-user-service:v3.0.0 --image applyai-user-service:latest --file services/user-service/Dockerfile .
```

### Analytics Service
```powershell
az acr build --registry applyforusacr --image applyai-analytics-service:v3.0.0 --image applyai-analytics-service:latest --file services/analytics-service/Dockerfile .
```

### API Gateway
```powershell
az acr build --registry applyforusacr --image applyai-api-gateway:v3.0.0 --image applyai-api-gateway:latest --file services/api-gateway/Dockerfile .
```

## Verify Builds

```powershell
az acr repository list --name applyforusacr --output table
az acr repository show-tags --name applyforusacr --repository applyai-web --output table
```

## Status

- ✅ job-service:v3.0.0 already exists
- ⏳ web:v3.0.0 - needs build
- ⏳ auth-service:v3.0.0 - needs build
- ⏳ user-service:v3.0.0 - needs build
- ⏳ analytics-service:v3.0.0 - needs build
- ⏳ api-gateway:v3.0.0 - needs build (new)

## Expected Build Time

- ~4-5 minutes per service
- Total: ~20-25 minutes for all 5 services

## Note on job-service

job-service already has v3.0.0 tag, so it doesn't need to be rebuilt unless there are new changes.
