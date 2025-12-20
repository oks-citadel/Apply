# PowerShell script to build and push Docker images to Azure Container Registry
# This script handles Windows path length limitations

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform"
$Registry = "applyforusacr"
$Version = "v3.0.0"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Azure Container Registry Build Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Change to project root
Set-Location $ProjectRoot

# Remove problematic node_modules to avoid path length issues
Write-Host "`nCleaning up problematic directories..." -ForegroundColor Yellow

$dirsToClean = @(
    "apps\mobile\node_modules",
    "apps\admin\node_modules",
    "apps\employer\node_modules",
    "apps\extension\node_modules"
)

foreach ($dir in $dirsToClean) {
    $fullPath = Join-Path $ProjectRoot $dir
    if (Test-Path $fullPath) {
        Write-Host "Removing $dir..." -ForegroundColor Yellow
        Remove-Item -Path $fullPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Define services to build
$services = @(
    @{Name="web"; Dockerfile="apps/web/Dockerfile"},
    @{Name="auth-service"; Dockerfile="services/auth-service/Dockerfile"},
    @{Name="user-service"; Dockerfile="services/user-service/Dockerfile"},
    @{Name="analytics-service"; Dockerfile="services/analytics-service/Dockerfile"},
    @{Name="api-gateway"; Dockerfile="services/api-gateway/Dockerfile"}
)

# Build each service
$successCount = 0
$failCount = 0

foreach ($service in $services) {
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "Building $($service.Name)..." -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan

    $env:PYTHONIOENCODING = "utf-8"

    try {
        az acr build `
            --registry $Registry `
            --image "applyai-$($service.Name):$Version" `
            --image "applyai-$($service.Name):latest" `
            --file $service.Dockerfile `
            .

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully built $($service.Name)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "Failed to build $($service.Name)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "Error building $($service.Name): $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Successful builds: $successCount" -ForegroundColor Green
Write-Host "Failed builds: $failCount" -ForegroundColor Red

# List images in ACR
Write-Host "`nImages in registry:" -ForegroundColor Cyan
az acr repository list --name $Registry --output table
