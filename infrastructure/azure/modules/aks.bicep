// ============================================================================
// Azure Kubernetes Service (AKS) Module
// ============================================================================
// This module creates an AKS cluster with:
// - Workload Identity enabled
// - OIDC Issuer enabled
// - Managed Identity for kubelet
// - Integration with ACR via managed identity

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('AKS Kubernetes version')
param kubernetesVersion string = '1.28.3'

@description('Virtual Network Subnet ID for AKS')
param subnetId string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Kubelet Managed Identity Resource ID')
param kubeletManagedIdentityId string

@description('Enable Azure Policy add-on')
param enableAzurePolicy bool = true

@description('Enable Azure Monitor Container Insights')
param enableMonitoring bool = true

@description('Enable private cluster')
param enablePrivateCluster bool = false

// ============================================================================
// Variables
// ============================================================================

var aksClusterName = '${projectName}-${environment}-aks'
var dnsPrefix = '${projectName}-${environment}'

// Environment-specific configurations
var environmentConfig = {
  dev: {
    nodeCount: 2
    minNodeCount: 1
    maxNodeCount: 5
    vmSize: 'Standard_D2s_v3'
    osDiskSizeGB: 50
    enableAutoScaling: true
  }
  staging: {
    nodeCount: 3
    minNodeCount: 2
    maxNodeCount: 10
    vmSize: 'Standard_D4s_v3'
    osDiskSizeGB: 100
    enableAutoScaling: true
  }
  prod: {
    nodeCount: 5
    minNodeCount: 3
    maxNodeCount: 20
    vmSize: 'Standard_D8s_v3'
    osDiskSizeGB: 128
    enableAutoScaling: true
  }
}

var config = environmentConfig[environment]

// ============================================================================
// AKS Cluster
// ============================================================================

resource aksCluster 'Microsoft.ContainerService/managedClusters@2023-10-01' = {
  name: aksClusterName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: 'Base'
    tier: environment == 'prod' ? 'Standard' : 'Free'
  }
  properties: {
    kubernetesVersion: kubernetesVersion
    dnsPrefix: dnsPrefix
    enableRBAC: true

    // Enable Workload Identity and OIDC Issuer for managed identity federation
    securityProfile: {
      workloadIdentity: {
        enabled: true
      }
    }
    oidcIssuerProfile: {
      enabled: true
    }

    // Network configuration
    networkProfile: {
      networkPlugin: 'azure'
      networkPolicy: 'azure'
      serviceCidr: '10.0.0.0/16'
      dnsServiceIP: '10.0.0.10'
      loadBalancerSku: 'standard'
      outboundType: 'loadBalancer'
    }

    // Default node pool (system pool)
    agentPoolProfiles: [
      {
        name: 'systempool'
        count: config.nodeCount
        vmSize: config.vmSize
        osDiskSizeGB: config.osDiskSizeGB
        osDiskType: 'Managed'
        osType: 'Linux'
        type: 'VirtualMachineScaleSets'
        mode: 'System'
        vnetSubnetID: subnetId
        enableAutoScaling: config.enableAutoScaling
        minCount: config.enableAutoScaling ? config.minNodeCount : null
        maxCount: config.enableAutoScaling ? config.maxNodeCount : null
        maxPods: 110
        enableNodePublicIP: false
        enableEncryptionAtHost: true
        kubeletDiskType: 'OS'
        tags: tags
      }
    ]

    // API Server configuration
    apiServerAccessProfile: {
      enablePrivateCluster: enablePrivateCluster
      enablePrivateClusterPublicFQDN: enablePrivateCluster
    }

    // Azure Active Directory integration
    aadProfile: {
      managed: true
      enableAzureRBAC: true
      adminGroupObjectIDs: []
      tenantID: subscription().tenantId
    }

    // Auto-upgrade configuration
    autoUpgradeProfile: {
      upgradeChannel: environment == 'prod' ? 'stable' : 'patch'
    }

    // Add-ons configuration
    addonProfiles: {
      azurepolicy: {
        enabled: enableAzurePolicy
      }
      omsagent: {
        enabled: enableMonitoring
        config: {
          logAnalyticsWorkspaceResourceID: logAnalyticsWorkspaceId
        }
      }
      azureKeyvaultSecretsProvider: {
        enabled: true
        config: {
          enableSecretRotation: 'true'
          rotationPollInterval: '2m'
        }
      }
    }

    // Disable local accounts (use Azure AD only)
    disableLocalAccounts: true

    // Enable Azure Defender
    securityProfile: {
      defender: {
        logAnalyticsWorkspaceResourceId: logAnalyticsWorkspaceId
        securityMonitoring: {
          enabled: environment == 'prod' ? true : false
        }
      }
      workloadIdentity: {
        enabled: true
      }
    }

    // Kubelet Identity configuration
    identityProfile: {
      kubeletidentity: {
        resourceId: kubeletManagedIdentityId
      }
    }
  }
}

// ============================================================================
// User Node Pool (for application workloads)
// ============================================================================

resource userNodePool 'Microsoft.ContainerService/managedClusters/agentPools@2023-10-01' = {
  name: 'userpool'
  parent: aksCluster
  properties: {
    count: config.nodeCount
    vmSize: config.vmSize
    osDiskSizeGB: config.osDiskSizeGB
    osDiskType: 'Managed'
    osType: 'Linux'
    type: 'VirtualMachineScaleSets'
    mode: 'User'
    vnetSubnetID: subnetId
    enableAutoScaling: config.enableAutoScaling
    minCount: config.enableAutoScaling ? config.minNodeCount : null
    maxCount: config.enableAutoScaling ? config.maxNodeCount : null
    maxPods: 110
    enableNodePublicIP: false
    enableEncryptionAtHost: true
    kubeletDiskType: 'OS'
    tags: union(tags, {
      NodePoolType: 'User'
      WorkloadType: 'Application'
    })
    nodeLabels: {
      'workload-type': 'application'
    }
    nodeTaints: []
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${aksClusterName}-diagnostics'
  scope: aksCluster
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      {
        category: 'kube-apiserver'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'kube-audit'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'kube-audit-admin'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'kube-controller-manager'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'kube-scheduler'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'cluster-autoscaler'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'guard'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output aksClusterId string = aksCluster.id
output aksClusterName string = aksCluster.name
output aksClusterFqdn string = aksCluster.properties.fqdn
output aksClusterApiServerAddress string = aksCluster.properties.fqdn
output aksOidcIssuerUrl string = aksCluster.properties.oidcIssuerProfile.issuerURL
output aksKubeletIdentityObjectId string = aksCluster.properties.identityProfile.kubeletidentity.objectId
output aksKubeletIdentityClientId string = aksCluster.properties.identityProfile.kubeletidentity.clientId
output aksClusterPrincipalId string = aksCluster.identity.principalId
output aksClusterTenantId string = aksCluster.identity.tenantId
output aksNodeResourceGroup string = aksCluster.properties.nodeResourceGroup
