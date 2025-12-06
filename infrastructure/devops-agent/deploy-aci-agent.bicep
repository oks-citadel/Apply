// Azure DevOps Self-Hosted Agent - Container Instance
// Deploys an agent that registers with Azure DevOps

param location string = resourceGroup().location
param azpUrl string = 'https://dev.azure.com/citadelcloudmanagement'
param azpPool string = 'Default'
param agentName string = 'terraform-agent-1'

@secure()
param azpToken string

resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: agentName
  location: location
  properties: {
    osType: 'Linux'
    restartPolicy: 'Always'
    containers: [
      {
        name: agentName
        properties: {
          image: 'mcr.microsoft.com/cbl-mariner/base/core:2.0'
          resources: {
            requests: {
              cpu: 2
              memoryInGB: 4
            }
          }
          environmentVariables: [
            { name: 'AZP_URL', value: azpUrl }
            { name: 'AZP_POOL', value: azpPool }
            { name: 'AZP_AGENT_NAME', value: agentName }
            { name: 'AZP_TOKEN', secureValue: azpToken }
          ]
          command: [
            '/bin/sh'
            '-c'
            'tdnf install -y curl tar gzip icu ca-certificates && mkdir -p /azp/agent && cd /azp/agent && curl -fkSL -o vstsagent.tar.gz https://vstsagentpackage.azureedge.net/agent/3.232.3/vsts-agent-linux-x64-3.232.3.tar.gz && tar -zxvf vstsagent.tar.gz && ./config.sh --unattended --url $AZP_URL --auth pat --token $AZP_TOKEN --pool $AZP_POOL --agent $AZP_AGENT_NAME --acceptTeeEula && ./run.sh'
          ]
        }
      }
    ]
  }
}

output containerName string = containerGroup.name
output containerId string = containerGroup.id
