// ============================================================================
// Managed Identity Module
// ============================================================================
// This module creates User Assigned Managed Identities for:
// 1. CI/CD Pipeline (Azure DevOps) - for ACR push/pull
// 2. AKS Workloads - for workload identity and ACR pull
// 3. AKS Kubelet - for AKS cluster operations

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

// ============================================================================
// Variables
// ============================================================================

var cicdIdentityName = '${projectName}-${environment}-cicd-identity'
var workloadIdentityName = '${projectName}-${environment}-workload-identity'
var aksKubeletIdentityName = '${projectName}-${environment}-aks-kubelet-identity'

// ============================================================================
// User Assigned Managed Identities
// ============================================================================

// CI/CD Pipeline Identity
// Used by Azure DevOps pipelines to authenticate to ACR for pushing images
resource cicdManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: cicdIdentityName
  location: location
  tags: union(tags, {
    Purpose: 'CI/CD Pipeline Authentication'
    Usage: 'ACR Push/Pull, Azure Resources Access'
  })
}

// Workload Identity for AKS Pods
// Used by Kubernetes pods via workload identity federation to access Azure resources
resource workloadManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: workloadIdentityName
  location: location
  tags: union(tags, {
    Purpose: 'AKS Workload Identity'
    Usage: 'Pod-level access to Azure resources'
  })
}

// AKS Kubelet Identity
// Used by AKS kubelet to pull images from ACR and manage node operations
resource aksKubeletManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: aksKubeletIdentityName
  location: location
  tags: union(tags, {
    Purpose: 'AKS Kubelet Identity'
    Usage: 'AKS node operations and ACR pull'
  })
}

// ============================================================================
// Federated Identity Credentials for Workload Identity
// ============================================================================
// These will be created after AKS cluster is deployed
// Uncomment and configure after AKS OIDC issuer is available

// resource workloadFederatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
//   name: 'jobpilot-workload-federation'
//   parent: workloadManagedIdentity
//   properties: {
//     issuer: 'https://${aksOidcIssuer}' // Will be populated from AKS output
//     subject: 'system:serviceaccount:jobpilot:jobpilot-service-account'
//     audiences: [
//       'api://AzureADTokenExchange'
//     ]
//   }
// }

// ============================================================================
// Outputs
// ============================================================================

output cicdManagedIdentityId string = cicdManagedIdentity.id
output cicdManagedIdentityName string = cicdManagedIdentity.name
output cicdManagedIdentityClientId string = cicdManagedIdentity.properties.clientId
output cicdManagedIdentityPrincipalId string = cicdManagedIdentity.properties.principalId
output cicdManagedIdentityTenantId string = cicdManagedIdentity.properties.tenantId

output workloadManagedIdentityId string = workloadManagedIdentity.id
output workloadManagedIdentityName string = workloadManagedIdentity.name
output workloadManagedIdentityClientId string = workloadManagedIdentity.properties.clientId
output workloadManagedIdentityPrincipalId string = workloadManagedIdentity.properties.principalId
output workloadManagedIdentityTenantId string = workloadManagedIdentity.properties.tenantId

output aksKubeletManagedIdentityId string = aksKubeletManagedIdentity.id
output aksKubeletManagedIdentityName string = aksKubeletManagedIdentity.name
output aksKubeletManagedIdentityClientId string = aksKubeletManagedIdentity.properties.clientId
output aksKubeletManagedIdentityPrincipalId string = aksKubeletManagedIdentity.properties.principalId
output aksKubeletManagedIdentityTenantId string = aksKubeletManagedIdentity.properties.tenantId
