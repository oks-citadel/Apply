// ============================================================================
// Application Gateway with WAF v2 Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('Virtual Network Name')
param vnetName string

@description('Backend App Service URLs')
param backendAppServices object

@description('Enable WAF')
param enableWaf bool = true

@description('WAF Mode')
@allowed(['Detection', 'Prevention'])
param wafMode string = 'Prevention'

// ============================================================================
// Variables
// ============================================================================

var appGatewayName = '${projectName}-${environment}-appgw'
var wafPolicyName = '${projectName}-${environment}-waf-policy'
var publicIpName = '${projectName}-${environment}-appgw-pip'
var appGatewaySubnetName = 'application-gateway-subnet'

// Capacity based on environment
var capacityConfig = {
  dev: {
    minCapacity: 1
    maxCapacity: 2
  }
  staging: {
    minCapacity: 2
    maxCapacity: 5
  }
  prod: {
    minCapacity: 3
    maxCapacity: 10
  }
}

var capacity = capacityConfig[environment]

// ============================================================================
// Public IP for Application Gateway
// ============================================================================

resource publicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: publicIpName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
    dnsSettings: {
      domainNameLabel: '${projectName}-${environment}-gw'
    }
  }
}

// ============================================================================
// Virtual Network Reference
// ============================================================================

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' existing = {
  name: vnetName
}

// ============================================================================
// Application Gateway Subnet
// ============================================================================

resource appGatewaySubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  parent: vnet
  name: appGatewaySubnetName
  properties: {
    addressPrefix: environment == 'prod' ? '10.0.5.0/24' : environment == 'staging' ? '10.1.5.0/24' : '10.2.5.0/24'
    privateEndpointNetworkPolicies: 'Disabled'
    privateLinkServiceNetworkPolicies: 'Disabled'
  }
}

// ============================================================================
// WAF Policy with OWASP 3.2 Rules
// ============================================================================

resource wafPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2023-05-01' = if (enableWaf) {
  name: wafPolicyName
  location: location
  tags: tags
  properties: {
    policySettings: {
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 100
      state: 'Enabled'
      mode: wafMode
      requestBodyInspectLimitInKB: 128
      fileUploadEnforcement: true
      requestBodyEnforcement: true
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
          ruleGroupOverrides: []
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
      exclusions: []
    }
    customRules: [
      // Rate limiting rule - max 100 requests per minute per IP
      {
        name: 'RateLimitRule'
        priority: 1
        ruleType: 'RateLimitRule'
        rateLimitDuration: 'OneMin'
        rateLimitThreshold: 100
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'IPMatch'
            negationConditon: false
            matchValues: [
              '0.0.0.0/0'
            ]
          }
        ]
        action: 'Block'
      }
      // Block requests with suspicious SQL patterns
      {
        name: 'BlockSQLInjection'
        priority: 2
        ruleType: 'MatchRule'
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RequestUri'
              }
              {
                variableName: 'QueryString'
              }
            ]
            operator: 'Contains'
            negationConditon: false
            matchValues: [
              'union'
              'select'
              'insert'
              'drop'
              'delete'
              'exec'
              'script'
            ]
            transforms: [
              'Lowercase'
              'UrlDecode'
            ]
          }
        ]
        action: 'Block'
      }
      // Block requests from known malicious IPs (example)
      {
        name: 'BlockMaliciousIPs'
        priority: 3
        ruleType: 'MatchRule'
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'IPMatch'
            negationConditon: false
            matchValues: [
              // Add specific IPs or ranges to block
              '192.0.2.0/24' // Example - RFC 5737 documentation range
            ]
          }
        ]
        action: 'Block'
      }
      // Geo-blocking rule (optional - block traffic from specific countries)
      {
        name: 'GeoBlockingRule'
        priority: 4
        ruleType: 'MatchRule'
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'GeoMatch'
            negationConditon: true
            matchValues: [
              'US'
              'CA'
              'GB'
              'AU'
              'DE'
              'FR'
              'JP'
            ]
          }
        ]
        action: environment == 'prod' ? 'Block' : 'Log'
      }
    ]
  }
}

// ============================================================================
// Application Gateway
// ============================================================================

resource applicationGateway 'Microsoft.Network/applicationGateways@2023-05-01' = {
  name: appGatewayName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'WAF_v2'
      tier: 'WAF_v2'
    }
    autoscaleConfiguration: {
      minCapacity: capacity.minCapacity
      maxCapacity: capacity.maxCapacity
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: {
            id: appGatewaySubnet.id
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGatewayFrontendIP'
        properties: {
          publicIPAddress: {
            id: publicIp.id
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'port_80'
        properties: {
          port: 80
        }
      }
      {
        name: 'port_443'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'webAppBackendPool'
        properties: {
          backendAddresses: [
            {
              fqdn: backendAppServices.webAppFqdn
            }
          ]
        }
      }
      {
        name: 'authServiceBackendPool'
        properties: {
          backendAddresses: [
            {
              fqdn: backendAppServices.authServiceFqdn
            }
          ]
        }
      }
      {
        name: 'aiServiceBackendPool'
        properties: {
          backendAddresses: [
            {
              fqdn: backendAppServices.aiServiceFqdn
            }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'webAppHttpSettings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 30
          probe: {
            id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'webAppHealthProbe')
          }
          connectionDraining: {
            enabled: true
            drainTimeoutInSec: 60
          }
        }
      }
      {
        name: 'authServiceHttpSettings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 30
          probe: {
            id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'authServiceHealthProbe')
          }
          connectionDraining: {
            enabled: true
            drainTimeoutInSec: 60
          }
        }
      }
      {
        name: 'aiServiceHttpSettings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 60
          probe: {
            id: resourceId('Microsoft.Network/applicationGateways/probes', appGatewayName, 'aiServiceHealthProbe')
          }
          connectionDraining: {
            enabled: true
            drainTimeoutInSec: 60
          }
        }
      }
    ]
    httpListeners: [
      {
        name: 'webAppListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGatewayFrontendIP')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_80')
          }
          protocol: 'Http'
          requireServerNameIndication: false
        }
      }
      {
        name: 'authServiceListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGatewayFrontendIP')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_80')
          }
          protocol: 'Http'
          hostName: 'api.${projectName}.com'
          requireServerNameIndication: false
        }
      }
      {
        name: 'aiServiceListener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', appGatewayName, 'appGatewayFrontendIP')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', appGatewayName, 'port_80')
          }
          protocol: 'Http'
          hostName: 'ai.${projectName}.com'
          requireServerNameIndication: false
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'webAppRule'
        properties: {
          ruleType: 'Basic'
          priority: 100
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'webAppListener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'webAppBackendPool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'webAppHttpSettings')
          }
        }
      }
      {
        name: 'authServiceRule'
        properties: {
          ruleType: 'Basic'
          priority: 200
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'authServiceListener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'authServiceBackendPool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'authServiceHttpSettings')
          }
        }
      }
      {
        name: 'aiServiceRule'
        properties: {
          ruleType: 'Basic'
          priority: 300
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', appGatewayName, 'aiServiceListener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', appGatewayName, 'aiServiceBackendPool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', appGatewayName, 'aiServiceHttpSettings')
          }
        }
      }
    ]
    probes: [
      {
        name: 'webAppHealthProbe'
        properties: {
          protocol: 'Https'
          path: '/api/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: true
          minServers: 0
          match: {
            statusCodes: [
              '200-399'
            ]
          }
        }
      }
      {
        name: 'authServiceHealthProbe'
        properties: {
          protocol: 'Https'
          path: '/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: true
          minServers: 0
          match: {
            statusCodes: [
              '200-399'
            ]
          }
        }
      }
      {
        name: 'aiServiceHealthProbe'
        properties: {
          protocol: 'Https'
          path: '/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
          pickHostNameFromBackendHttpSettings: true
          minServers: 0
          match: {
            statusCodes: [
              '200-399'
            ]
          }
        }
      }
    ]
    enableHttp2: true
    firewallPolicy: enableWaf ? {
      id: wafPolicy.id
    } : null
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource appGatewayDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${appGatewayName}-diagnostics'
  scope: applicationGateway
  properties: {
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: environment == 'prod' ? 90 : 30
        }
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output applicationGatewayId string = applicationGateway.id
output applicationGatewayName string = applicationGateway.name
output publicIpAddress string = publicIp.properties.ipAddress
output wafPolicyId string = enableWaf ? wafPolicy.id : ''
output appGatewayFqdn string = publicIp.properties.dnsSettings.fqdn
