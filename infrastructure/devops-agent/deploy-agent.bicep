// ============================================================================
// Azure DevOps Self-Hosted Agent - Azure Container Instance
// ============================================================================
// Deploys a containerized Azure DevOps agent with Terraform pre-installed
//
// Usage:
//   az deployment group create \
//     --resource-group applyplatform-devops-agent-rg \
//     --template-file deploy-agent.bicep \
//     --parameters azpUrl='https://dev.azure.com/citadelcloudmanagement' \
//                  azpToken='<YOUR_PAT_TOKEN>' \
//                  azpPool='Default'
// ============================================================================

@description('Azure DevOps organization URL')
param azpUrl string = 'https://dev.azure.com/citadelcloudmanagement'

@description('Personal Access Token for agent registration')
@secure()
param azpToken string

@description('Agent pool name')
param azpPool string = 'Default'

@description('Agent name prefix')
param agentNamePrefix string = 'aci-terraform-agent'

@description('Location for resources')
param location string = resourceGroup().location

@description('Container instance CPU cores')
param cpuCores int = 2

@description('Container instance memory in GB')
param memoryInGB int = 4

@description('Number of agent instances')
param agentCount int = 1

// Managed Identity for Azure operations
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'devops-agent-identity'
  location: location
}

// Container Instance for each agent
resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = [for i in range(0, agentCount): {
  name: '${agentNamePrefix}-${i}'
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    osType: 'Linux'
    restartPolicy: 'Always'
    containers: [
      {
        name: 'azure-pipelines-agent'
        properties: {
          image: 'mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-22.04'
          resources: {
            requests: {
              cpu: cpuCores
              memoryInGB: memoryInGB
            }
          }
          environmentVariables: [
            {
              name: 'AZP_URL'
              value: azpUrl
            }
            {
              name: 'AZP_TOKEN'
              secureValue: azpToken
            }
            {
              name: 'AZP_POOL'
              value: azpPool
            }
            {
              name: 'AZP_AGENT_NAME'
              value: '${agentNamePrefix}-${i}'
            }
          ]
          // Install Terraform and other tools on startup
          command: [
            '/bin/bash'
            '-c'
            '''
            # Install Terraform
            wget -q https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip && \
            unzip -o terraform_1.6.0_linux_amd64.zip && \
            mv terraform /usr/local/bin/ && \
            rm terraform_1.6.0_linux_amd64.zip && \

            # Install Azure CLI
            curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \

            # Install tfsec
            curl -s https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash && \

            # Install Python and Checkov
            apt-get update && apt-get install -y python3 python3-pip && \
            pip3 install checkov && \

            # Start the agent
            /vsts/start.sh
            '''
          ]
        }
      }
    ]
  }
}]

// Outputs
output agentIdentityId string = managedIdentity.id
output agentIdentityPrincipalId string = managedIdentity.properties.principalId
output agentIdentityClientId string = managedIdentity.properties.clientId
output containerGroupNames array = [for i in range(0, agentCount): '${agentNamePrefix}-${i}']
