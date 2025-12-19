# ============================================================================
# AKS Automatic Shutdown/Startup Schedule for Non-Production
# ============================================================================
# This configuration implements automated shutdown and startup schedules
# for AKS clusters in non-production environments to reduce costs.
#
# Uses Azure Automation Runbooks to stop/start AKS node pools

# ============================================================================
# Automation Account for AKS Shutdown
# ============================================================================

resource "azurerm_automation_account" "aks_automation" {
  count               = var.enable_aks && var.environment != "prod" ? 1 : 0
  name                = "${var.project_name}-${var.environment}-aks-automation"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Basic"

  identity {
    type = "SystemAssigned"
  }

  tags = merge(
    local.common_tags,
    {
      Purpose = "AKS Cost Optimization"
    }
  )
}

# ============================================================================
# Role Assignment for Automation Account
# ============================================================================

resource "azurerm_role_assignment" "automation_aks_contributor" {
  count                = var.enable_aks && var.environment != "prod" ? 1 : 0
  scope                = module.aks[0].cluster_id
  role_definition_name = "Azure Kubernetes Service Contributor Role"
  principal_id         = azurerm_automation_account.aks_automation[0].identity[0].principal_id
}

# ============================================================================
# Runbook: Stop AKS Node Pools
# ============================================================================

resource "azurerm_automation_runbook" "stop_aks" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  name                    = "Stop-AKSNodePools"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  log_verbose             = "true"
  log_progress            = "true"
  description             = "Stops AKS node pools to reduce costs during off-hours"
  runbook_type            = "PowerShell"

  content = <<-RUNBOOK
    param(
        [Parameter(Mandatory=$true)]
        [string]$ResourceGroupName,

        [Parameter(Mandatory=$true)]
        [string]$ClusterName
    )

    # Connect using System-Assigned Managed Identity
    Connect-AzAccount -Identity

    Write-Output "Stopping AKS cluster: $ClusterName in resource group: $ResourceGroupName"

    try {
        # Get AKS cluster
        $cluster = Get-AzAksCluster -ResourceGroupName $ResourceGroupName -Name $ClusterName

        if ($null -eq $cluster) {
            Write-Error "AKS cluster not found"
            exit 1
        }

        # Stop all node pools except system pool (keep 1 node)
        $nodePools = Get-AzAksNodePool -ResourceGroupName $ResourceGroupName -ClusterName $ClusterName

        foreach ($nodePool in $nodePools) {
            if ($nodePool.Mode -eq "System") {
                # Scale system pool to minimum (1 node)
                Write-Output "Scaling system pool $($nodePool.Name) to 1 node"
                Set-AzAksNodePool -ResourceGroupName $ResourceGroupName `
                    -ClusterName $ClusterName `
                    -Name $nodePool.Name `
                    -NodeCount 1 `
                    -EnableAutoScaling $false
            } else {
                # Stop user node pools (scale to 0)
                Write-Output "Stopping user pool $($nodePool.Name)"
                Set-AzAksNodePool -ResourceGroupName $ResourceGroupName `
                    -ClusterName $ClusterName `
                    -Name $nodePool.Name `
                    -NodeCount 0 `
                    -EnableAutoScaling $false
            }
        }

        Write-Output "AKS cluster scaled down successfully"
    }
    catch {
        Write-Error "Error stopping AKS cluster: $_"
        exit 1
    }
  RUNBOOK

  tags = local.common_tags
}

# ============================================================================
# Runbook: Start AKS Node Pools
# ============================================================================

resource "azurerm_automation_runbook" "start_aks" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  name                    = "Start-AKSNodePools"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  log_verbose             = "true"
  log_progress            = "true"
  description             = "Starts AKS node pools during business hours"
  runbook_type            = "PowerShell"

  content = <<-RUNBOOK
    param(
        [Parameter(Mandatory=$true)]
        [string]$ResourceGroupName,

        [Parameter(Mandatory=$true)]
        [string]$ClusterName,

        [Parameter(Mandatory=$false)]
        [int]$SystemPoolNodeCount = 3,

        [Parameter(Mandatory=$false)]
        [int]$UserPoolNodeCount = 2
    )

    # Connect using System-Assigned Managed Identity
    Connect-AzAccount -Identity

    Write-Output "Starting AKS cluster: $ClusterName in resource group: $ResourceGroupName"

    try {
        # Get AKS cluster
        $cluster = Get-AzAksCluster -ResourceGroupName $ResourceGroupName -Name $ClusterName

        if ($null -eq $cluster) {
            Write-Error "AKS cluster not found"
            exit 1
        }

        # Start all node pools
        $nodePools = Get-AzAksNodePool -ResourceGroupName $ResourceGroupName -ClusterName $ClusterName

        foreach ($nodePool in $nodePools) {
            if ($nodePool.Mode -eq "System") {
                # Scale system pool to desired count
                Write-Output "Scaling system pool $($nodePool.Name) to $SystemPoolNodeCount nodes"
                Set-AzAksNodePool -ResourceGroupName $ResourceGroupName `
                    -ClusterName $ClusterName `
                    -Name $nodePool.Name `
                    -NodeCount $SystemPoolNodeCount `
                    -EnableAutoScaling $true `
                    -MinCount $SystemPoolNodeCount `
                    -MaxCount ($SystemPoolNodeCount * 2)
            } else {
                # Start user node pools
                Write-Output "Scaling user pool $($nodePool.Name) to $UserPoolNodeCount nodes"
                Set-AzAksNodePool -ResourceGroupName $ResourceGroupName `
                    -ClusterName $ClusterName `
                    -Name $nodePool.Name `
                    -NodeCount $UserPoolNodeCount `
                    -EnableAutoScaling $true `
                    -MinCount $UserPoolNodeCount `
                    -MaxCount ($UserPoolNodeCount * 3)
            }
        }

        Write-Output "AKS cluster scaled up successfully"
    }
    catch {
        Write-Error "Error starting AKS cluster: $_"
        exit 1
    }
  RUNBOOK

  tags = local.common_tags
}

# ============================================================================
# Schedule: Stop AKS - Weeknights
# ============================================================================

resource "azurerm_automation_schedule" "stop_aks_weeknight" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  name                    = "stop-aks-weeknight"
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  frequency               = "Week"
  interval                = 1
  timezone                = "UTC"

  # Stop at 8 PM UTC Monday-Friday
  start_time  = timeadd(timestamp(), "24h")
  description = "Stop AKS node pools at 8 PM UTC on weeknights"
  week_days   = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

resource "azurerm_automation_job_schedule" "stop_aks_weeknight" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  schedule_name           = azurerm_automation_schedule.stop_aks_weeknight[0].name
  runbook_name            = azurerm_automation_runbook.stop_aks[0].name

  parameters = {
    resourcegroupname = azurerm_resource_group.main.name
    clustername       = module.aks[0].cluster_name
  }
}

# ============================================================================
# Schedule: Start AKS - Morning
# ============================================================================

resource "azurerm_automation_schedule" "start_aks_morning" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  name                    = "start-aks-morning"
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  frequency               = "Week"
  interval                = 1
  timezone                = "UTC"

  # Start at 6 AM UTC Monday-Friday
  start_time  = timeadd(timestamp(), "24h")
  description = "Start AKS node pools at 6 AM UTC on weekdays"
  week_days   = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

resource "azurerm_automation_job_schedule" "start_aks_morning" {
  count                   = var.enable_aks && var.environment != "prod" ? 1 : 0
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  schedule_name           = azurerm_automation_schedule.start_aks_morning[0].name
  runbook_name            = azurerm_automation_runbook.start_aks[0].name

  parameters = {
    resourcegroupname   = azurerm_resource_group.main.name
    clustername         = module.aks[0].cluster_name
    systemPoolNodeCount = var.environment == "dev" ? "1" : "2"
    userPoolNodeCount   = var.environment == "dev" ? "1" : "2"
  }
}

# ============================================================================
# Schedule: Stop AKS - Weekend
# ============================================================================

resource "azurerm_automation_schedule" "stop_aks_weekend" {
  count                   = var.enable_aks && var.environment == "dev" ? 1 : 0
  name                    = "stop-aks-weekend"
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  frequency               = "Week"
  interval                = 1
  timezone                = "UTC"

  # Stop Friday 8 PM UTC
  start_time  = timeadd(timestamp(), "24h")
  description = "Stop AKS node pools for the weekend"
  week_days   = ["Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

resource "azurerm_automation_job_schedule" "stop_aks_weekend" {
  count                   = var.enable_aks && var.environment == "dev" ? 1 : 0
  resource_group_name     = azurerm_resource_group.main.name
  automation_account_name = azurerm_automation_account.aks_automation[0].name
  schedule_name           = azurerm_automation_schedule.stop_aks_weekend[0].name
  runbook_name            = azurerm_automation_runbook.stop_aks[0].name

  parameters = {
    resourcegroupname = azurerm_resource_group.main.name
    clustername       = module.aks[0].cluster_name
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "aks_automation_account_id" {
  description = "ID of the AKS automation account"
  value       = var.enable_aks && var.environment != "prod" ? azurerm_automation_account.aks_automation[0].id : null
}

output "aks_shutdown_schedules" {
  description = "AKS shutdown schedule configuration"
  value = var.enable_aks && var.environment != "prod" ? {
    stop_weeknight    = "8 PM UTC Monday-Friday"
    start_morning     = "6 AM UTC Monday-Friday"
    stop_weekend      = var.environment == "dev" ? "8 PM UTC Friday" : "N/A"
    estimated_savings = var.environment == "dev" ? "~$400/month" : "~$200/month"
  } : null
}
