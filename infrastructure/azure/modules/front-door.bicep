// ============================================================================
// Azure Front Door Premium with WAF Module (Alternative to App Gateway)
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('Backend App Service URLs')
param backendAppServices object

@description('Enable WAF')
param enableWaf bool = true

@description('WAF Mode')
@allowed(['Detection', 'Prevention'])
param wafMode string = 'Prevention'

@description('Enable CDN caching')
param enableCaching bool = true

// ============================================================================
// Variables
// ============================================================================

var frontDoorName = '${projectName}-${environment}-fd'
var wafPolicyName = '${projectName}${environment}wafpolicy' // No hyphens allowed
var frontDoorEndpointName = '${projectName}-${environment}-endpoint'

// ============================================================================
// Front Door WAF Policy
// ============================================================================

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = if (enableWaf) {
  name: wafPolicyName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: wafMode
      requestBodyCheck: 'Enabled'
      maxRequestBodySizeInKb: 128
      fileUploadEnforcement: true
      requestBodyEnforcement: true
      customBlockResponseStatusCode: 403
      customBlockResponseBody: base64('{"error": "Request blocked by WAF"}')
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleSetAction: 'Block'
          exclusions: []
          ruleGroupOverrides: []
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
          ruleGroupOverrides: []
        }
      ]
    }
    customRules: {
      rules: [
        // Rate limiting - 100 requests per minute
        {
          name: 'RateLimitRule'
          priority: 1
          enabledState: 'Enabled'
          ruleType: 'RateLimitRule'
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 100
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              negateCondition: false
              matchValue: [
                '0.0.0.0/0'
                '::/0'
              ]
            }
          ]
          action: 'Block'
        }
        // Block known malicious user agents
        {
          name: 'BlockMaliciousUserAgents'
          priority: 2
          enabledState: 'Enabled'
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestHeader'
              selector: 'User-Agent'
              operator: 'Contains'
              negateCondition: false
              matchValue: [
                'sqlmap'
                'nikto'
                'nmap'
                'masscan'
                'metasploit'
              ]
              transforms: [
                'Lowercase'
              ]
            }
          ]
          action: 'Block'
        }
        // Block requests with suspicious patterns
        {
          name: 'BlockSuspiciousPatterns'
          priority: 3
          enabledState: 'Enabled'
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'Contains'
              negateCondition: false
              matchValue: [
                '../'
                '..'
                'etc/passwd'
                'cmd.exe'
                '/bin/bash'
              ]
              transforms: [
                'Lowercase'
                'UrlDecode'
              ]
            }
          ]
          action: 'Block'
        }
        // Geo-filtering (allow only specific countries)
        {
          name: 'GeoFiltering'
          priority: 4
          enabledState: environment == 'prod' ? 'Enabled' : 'Disabled'
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'GeoMatch'
              negateCondition: true
              matchValue: [
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
          action: 'Block'
        }
        // Block specific IPs
        {
          name: 'BlockMaliciousIPs'
          priority: 5
          enabledState: 'Enabled'
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              negateCondition: false
              matchValue: [
                '192.0.2.0/24' // Example - add actual malicious IPs
              ]
            }
          ]
          action: 'Block'
        }
      ]
    }
  }
}

// ============================================================================
// Front Door Profile
// ============================================================================

resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: frontDoorName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

// ============================================================================
// Front Door Endpoint
// ============================================================================

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoor
  name: frontDoorEndpointName
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

// ============================================================================
// Origin Groups
// ============================================================================

resource webAppOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoor
  name: 'web-app-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/api/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

resource authServiceOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoor
  name: 'auth-service-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

resource aiServiceOriginGroup 'Microsoft.Cdn/profiles/originGroups@2023-05-01' = {
  parent: frontDoor
  name: 'ai-service-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

// ============================================================================
// Origins
// ============================================================================

resource webAppOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: webAppOriginGroup
  name: 'web-app-origin'
  properties: {
    hostName: backendAppServices.webAppFqdn
    httpPort: 80
    httpsPort: 443
    originHostHeader: backendAppServices.webAppFqdn
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

resource authServiceOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: authServiceOriginGroup
  name: 'auth-service-origin'
  properties: {
    hostName: backendAppServices.authServiceFqdn
    httpPort: 80
    httpsPort: 443
    originHostHeader: backendAppServices.authServiceFqdn
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

resource aiServiceOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2023-05-01' = {
  parent: aiServiceOriginGroup
  name: 'ai-service-origin'
  properties: {
    hostName: backendAppServices.aiServiceFqdn
    httpPort: 80
    httpsPort: 443
    originHostHeader: backendAppServices.aiServiceFqdn
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
    enforceCertificateNameCheck: true
  }
}

// ============================================================================
// Routes
// ============================================================================

resource webAppRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'web-app-route'
  dependsOn: [
    webAppOrigin
  ]
  properties: {
    originGroup: {
      id: webAppOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: enableCaching ? {
      queryStringCachingBehavior: 'IgnoreQueryString'
      compressionSettings: {
        contentTypesToCompress: [
          'application/javascript'
          'application/json'
          'application/xml'
          'text/css'
          'text/html'
          'text/javascript'
          'text/plain'
        ]
        isCompressionEnabled: true
      }
    } : null
  }
}

resource authServiceRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'auth-service-route'
  dependsOn: [
    authServiceOrigin
  ]
  properties: {
    originGroup: {
      id: authServiceOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/api/*'
      '/auth/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: null // No caching for auth endpoints
  }
}

resource aiServiceRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2023-05-01' = {
  parent: endpoint
  name: 'ai-service-route'
  dependsOn: [
    aiServiceOrigin
  ]
  properties: {
    originGroup: {
      id: aiServiceOriginGroup.id
    }
    supportedProtocols: [
      'Http'
      'Https'
    ]
    patternsToMatch: [
      '/ai/*'
      '/generate/*'
    ]
    forwardingProtocol: 'HttpsOnly'
    linkToDefaultDomain: 'Enabled'
    httpsRedirect: 'Enabled'
    enabledState: 'Enabled'
    cacheConfiguration: null // No caching for AI endpoints
  }
}

// ============================================================================
// Security Policy (Link WAF to Endpoint)
// ============================================================================

resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2023-05-01' = if (enableWaf) {
  parent: frontDoor
  name: 'security-policy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicy.id
      }
      associations: [
        {
          domains: [
            {
              id: endpoint.id
            }
          ]
          patternsToMatch: [
            '/*'
          ]
        }
      ]
    }
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource frontDoorDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${frontDoorName}-diagnostics'
  scope: frontDoor
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

output frontDoorId string = frontDoor.id
output frontDoorName string = frontDoor.name
output frontDoorEndpointHostName string = endpoint.properties.hostName
output wafPolicyId string = enableWaf ? wafPolicy.id : ''
output frontDoorUrl string = 'https://${endpoint.properties.hostName}'
