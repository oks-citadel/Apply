################################################################################
# Deploy JobPilot Infrastructure with Private Endpoints
################################################################################
# This script deploys the Azure infrastructure with private networking enabled
# for secure, production-grade deployments.
#
# Usage:
#   .\deploy-private.ps1 -Environment <env> [options]
#
# Parameters:
#   -Environment        Environment to deploy (dev, staging, prod) [Required]
#   -Location           Azure region (default: eastus)
#   -ProjectName        Project name (default: jobpilot)
#   -SqlUsername        SQL admin username
#   -SqlPassword        SQL admin password (SecureString)
#   -AllowedIPs         Array of allowed IPs (optional)
#   -DryRun             Validate only, don't deploy
#   -WhatIf             Show what would change without deploying
#
# Examples:
#   # Deploy to production with private endpoints
#   $pass = ConvertTo-SecureString 'SecurePass123!' -AsPlainText -Force
#   .\deploy-private.ps1 -Environment prod -SqlUsername sqladmin -SqlPassword $pass
#
#   # Deploy to staging with IP allowlist
#   .\deploy-private.ps1 -Environment staging -AllowedIPs @("203.0.113.0/24", "198.51.100.5")
#
#   # Dry run for production
#   .\deploy-private.ps1 -Environment prod -DryRun
################################################################################

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",

    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "jobpilot",

    [Parameter(Mandatory=$false)]
    [string]$SqlUsername,

    [Parameter(Mandatory=$false)]
    [SecureString]$SqlPassword,

    [Parameter(Mandatory=$false)]
    [string[]]$AllowedIPs = @(),

    [Parameter(Mandatory=$false)]
    [switch]$DryRun,

    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Functions for colored output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Info "Deploying JobPilot infrastructure to $Environment environment"
Write-Host ""

# Check if Azure CLI is installed
try {
    $null = az --version
} catch {
    Write-Error "Azure CLI is not installed. Please install it first."
    exit 1
}

# Check if logged in to Azure
try {
    $null = az account show 2>$null
} catch {
    Write-Error "Not logged in to Azure. Please run 'az login' first."
    exit 1
}

# Get subscription info
$subscriptionName = az account show --query name -o tsv
$subscriptionId = az account show --query id -o tsv

Write-Info "Using Azure subscription: $subscriptionName ($subscriptionId)"

# Validate parameter file or SQL credentials
$paramFile = "parameters\$Environment.json"
if (-not (Test-Path $paramFile)) {
    if (-not $SqlUsername -or -not $SqlPassword) {
        Write-Error "SQL credentials are required. Use -SqlUsername and -SqlPassword"
        exit 1
    }
}

# Determine if private endpoints should be enabled
$enablePrivateEndpoints = "false"
if ($Environment -eq "prod") {
    $enablePrivateEndpoints = "true"
    Write-Info "Private endpoints: ENABLED (production environment)"
} elseif ($Environment -eq "staging") {
    $enablePrivateEndpoints = "true"
    Write-Info "Private endpoints: ENABLED (staging environment)"
} else {
    $enablePrivateEndpoints = "false"
    Write-Info "Private endpoints: DISABLED (development environment)"
}

# Build allowed IPs parameter
$allowedIpsParam = "[]"
if ($AllowedIPs.Count -gt 0) {
    $ipList = $AllowedIPs | ForEach-Object { "`"$_`"" }
    $allowedIpsParam = "[" + ($ipList -join ",") + "]"
    Write-Info "Allowed IP addresses: $($AllowedIPs -join ', ')"
}

# Generate deployment name
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deploymentName = "$ProjectName-$Environment-private-$timestamp"

# Build deployment command
$deployCmd = @(
    "az", "deployment", "sub", "create",
    "--name", $deploymentName,
    "--location", $Location,
    "--template-file", "main.bicep"
)

# Add parameters
if (Test-Path $paramFile) {
    Write-Info "Using parameter file: $paramFile"
    $deployCmd += "--parameters"
    $deployCmd += "@$paramFile"
    $deployCmd += "enablePrivateEndpoints=$enablePrivateEndpoints"

    if ($AllowedIPs.Count -gt 0) {
        $deployCmd += "allowedIpAddresses=$allowedIpsParam"
    }
} else {
    # Use command-line parameters
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SqlPassword)
    )

    $parametersJson = @{
        environment = @{ value = $Environment }
        location = @{ value = $Location }
        projectName = @{ value = $ProjectName }
        sqlAdminUsername = @{ value = $SqlUsername }
        sqlAdminPassword = @{ value = $plainPassword }
        enablePrivateEndpoints = @{ value = [bool]::Parse($enablePrivateEndpoints) }
        allowedIpAddresses = @{ value = $AllowedIPs }
    } | ConvertTo-Json -Depth 3

    $tempParamFile = [System.IO.Path]::GetTempFileName()
    $parametersJson | Out-File -FilePath $tempParamFile -Encoding utf8

    $deployCmd += "--parameters"
    $deployCmd += "@$tempParamFile"
}

# Add what-if or validation flag
if ($WhatIf) {
    $deployCmd += "--what-if"
    Write-Info "Running what-if analysis..."
} elseif ($DryRun) {
    $deployCmd += "--validate-only"
    Write-Info "Running validation only (dry run)..."
}

# Display deployment configuration
Write-Host ""
Write-Info "Deployment Configuration:"
Write-Host "  Environment:          $Environment"
Write-Host "  Location:             $Location"
Write-Host "  Project:              $ProjectName"
Write-Host "  Private Endpoints:    $enablePrivateEndpoints"
Write-Host "  Allowed IPs:          $($AllowedIPs -join ', ')"
Write-Host "  Deployment Name:      $deploymentName"
Write-Host ""

# Confirm deployment
if (-not $DryRun -and -not $WhatIf) {
    $confirmation = Read-Host "Proceed with deployment? (yes/no)"
    if ($confirmation -notmatch '^y(es)?$') {
        Write-Warning "Deployment cancelled"
        exit 0
    }
}

# Execute deployment
Write-Info "Starting deployment..."
Write-Host ""

try {
    # Change to the Azure directory
    Push-Location $PSScriptRoot

    # Execute deployment
    $output = & $deployCmd[0] $deployCmd[1..($deployCmd.Length-1)] 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment completed successfully!"

        if (-not $DryRun -and -not $WhatIf) {
            # Get deployment outputs
            $resourceGroup = "$ProjectName-$Environment-rg"

            Write-Info "Deployment Outputs:"
            $outputs = az deployment sub show `
                --name $deploymentName `
                --query properties.outputs `
                -o json | ConvertFrom-Json

            $outputs | ConvertTo-Json -Depth 10 | Write-Host

            # Display next steps
            Write-Host ""
            Write-Success "Next Steps:"
            Write-Host "  1. Verify private endpoint connectivity:"
            Write-Host "     az network private-endpoint list --resource-group $resourceGroup"
            Write-Host ""
            Write-Host "  2. Test DNS resolution from App Service:"
            Write-Host "     az webapp ssh --name $ProjectName-$Environment-web --resource-group $resourceGroup"
            Write-Host ""
            Write-Host "  3. Verify Key Vault access:"
            $kvName = az deployment sub show --name $deploymentName --query properties.outputs.keyVaultName.value -o tsv
            Write-Host "     az keyvault show --name $kvName"
            Write-Host ""

            if ($enablePrivateEndpoints -eq "true") {
                Write-Warning "Private endpoints are enabled. Services are only accessible from within the VNet."
                Write-Host "  Use Azure Bastion or VPN Gateway for administrative access."
            }
        }
    } else {
        Write-Error "Deployment failed!"
        Write-Host $output
        exit 1
    }
} catch {
    Write-Error "Deployment failed with exception: $_"
    exit 1
} finally {
    Pop-Location

    # Clean up temp file if created
    if ($tempParamFile -and (Test-Path $tempParamFile)) {
        Remove-Item $tempParamFile -Force
    }
}
