# JobPilot Azure Infrastructure - Documentation Index

Welcome to the JobPilot Azure Infrastructure documentation. This index will help you navigate all available resources.

## 📚 Quick Navigation

### Getting Started
- **[README.md](README.md)** - Main infrastructure overview and basic deployment
- **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)** - Latest deployment features and complete guide

### Feature-Specific Guides
- **[WAF-MONITORING-README.md](WAF-MONITORING-README.md)** - Web Application Firewall and Enhanced Monitoring
- **[PRIVATE_NETWORKING.md](PRIVATE_NETWORKING.md)** - Private Endpoints and Network Security
- **[README-PRIVATE-ENDPOINTS.md](README-PRIVATE-ENDPOINTS.md)** - Detailed Private Endpoints Guide
- **[QUICKSTART-PRIVATE-ENDPOINTS.md](QUICKSTART-PRIVATE-ENDPOINTS.md)** - Quick Private Endpoints Setup

### Security
- **[keyvault-secrets.md](keyvault-secrets.md)** - Key Vault secrets management

---

## 🏗️ Infrastructure Components

### Core Modules (`modules/`)

#### Networking
- **[networking.bicep](modules/networking.bicep)** - VNet, subnets, NSGs
- **[private-endpoints.bicep](modules/private-endpoints.bicep)** - Private endpoint configuration

#### Application Layer
- **[app-service-plan.bicep](modules/app-service-plan.bicep)** - App Service Plan with autoscaling
- **[app-services.bicep](modules/app-services.bicep)** - Web App, Auth, and AI services

#### Security & WAF
- **[application-gateway.bicep](modules/application-gateway.bicep)** - Application Gateway with WAF v2
- **[front-door.bicep](modules/front-door.bicep)** - Azure Front Door Premium with WAF

#### Data Layer
- **[sql-database.bicep](modules/sql-database.bicep)** - Azure SQL Database
- **[redis-cache.bicep](modules/redis-cache.bicep)** - Azure Cache for Redis
- **[service-bus.bicep](modules/service-bus.bicep)** - Azure Service Bus

#### Monitoring & Observability
- **[app-insights.bicep](modules/app-insights.bicep)** - Application Insights + Log Analytics
- **[monitoring.bicep](modules/monitoring.bicep)** - Alerts, availability tests, saved queries
- **[dashboards.bicep](modules/dashboards.bicep)** - Pre-configured Azure Monitor dashboards

#### Security & Secrets
- **[key-vault.bicep](modules/key-vault.bicep)** - Azure Key Vault
- **[key-vault-secrets.bicep](modules/key-vault-secrets.bicep)** - Secret storage automation

#### DevOps
- **[container-registry.bicep](modules/container-registry.bicep)** - Azure Container Registry

---

## 🚀 Deployment Scripts

### Main Deployment
- **[main.bicep](main.bicep)** - Master template orchestrating all modules

### Helper Scripts
- **[deploy-with-waf.sh](deploy-with-waf.sh)** - Interactive deployment with WAF options
- **[deploy-private.sh](deploy-private.sh)** - Deployment with private endpoints

---

## 📖 Documentation by Use Case

### I want to deploy the basic infrastructure
1. Read: [README.md](README.md)
2. Run: Basic deployment commands from README
3. Estimated time: 15-20 minutes
4. Cost: ~$150/month (dev), ~$800/month (prod)

### I want to add Web Application Firewall
1. Read: [WAF-MONITORING-README.md](WAF-MONITORING-README.md)
2. Read: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) - WAF section
3. Choose: Application Gateway or Azure Front Door
4. Run: `./deploy-with-waf.sh prod appgw Prevention`
5. Estimated time: 25-30 minutes
6. Additional cost: ~$380-405/month

### I want to add enhanced monitoring
1. Read: [WAF-MONITORING-README.md](WAF-MONITORING-README.md) - Monitoring section
2. Read: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) - Monitoring features
3. Deploy: Already included in all deployments
4. Configure: Set up email alerts and dashboard access
5. Additional cost: ~$27/month

### I want to add private networking
1. Read: [QUICKSTART-PRIVATE-ENDPOINTS.md](QUICKSTART-PRIVATE-ENDPOINTS.md)
2. Read: [PRIVATE_NETWORKING.md](PRIVATE_NETWORKING.md)
3. Run: `./deploy-private.sh prod`
4. Estimated time: 30-35 minutes
5. Additional cost: ~$50-100/month

### I want to secure secrets
1. Read: [keyvault-secrets.md](keyvault-secrets.md)
2. Configure: Key Vault access policies
3. Store: Application secrets
4. Reference: From App Services

---

## 🎯 Deployment Scenarios

### Scenario 1: Development Environment
**Goal:** Low-cost development and testing

**Features:**
- Basic App Services (B2 tier)
- Basic SQL Database
- Basic Redis Cache
- No WAF
- Standard monitoring

**Documentation:**
- [README.md](README.md)

**Cost:** ~$150/month

**Command:**
```bash
az deployment sub create \
  --location eastus \
  --template-file main.bicep \
  --parameters environment=dev
```

---

### Scenario 2: Staging with Security Testing
**Goal:** Test security features before production

**Features:**
- Standard App Services (S1 tier)
- Standard SQL Database
- Standard Redis Cache
- Application Gateway with WAF (Detection mode)
- Enhanced monitoring
- Private endpoints

**Documentation:**
- [WAF-MONITORING-README.md](WAF-MONITORING-README.md)
- [QUICKSTART-PRIVATE-ENDPOINTS.md](QUICKSTART-PRIVATE-ENDPOINTS.md)

**Cost:** ~$850/month

**Command:**
```bash
./deploy-with-waf.sh staging appgw Detection
```

---

### Scenario 3: Production (Regional)
**Goal:** Secure, monitored production in single region

**Features:**
- Premium App Services (P1v3 tier)
- Standard SQL Database (S3)
- Premium Redis Cache
- Application Gateway with WAF (Prevention mode)
- Enhanced monitoring with availability tests
- Private endpoints
- Azure Defender enabled

**Documentation:**
- [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)
- [WAF-MONITORING-README.md](WAF-MONITORING-README.md)

**Cost:** ~$1,250/month

**Command:**
```bash
./deploy-with-waf.sh prod appgw Prevention
```

---

### Scenario 4: Production (Global)
**Goal:** Global distribution with CDN and DDoS protection

**Features:**
- Premium App Services (P1v3 tier)
- Standard SQL Database (S3)
- Premium Redis Cache
- Azure Front Door Premium with WAF
- CDN for static content
- Enhanced monitoring with global availability tests
- Private endpoints
- Azure Defender enabled

**Documentation:**
- [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)
- [WAF-MONITORING-README.md](WAF-MONITORING-README.md) - Front Door section

**Cost:** ~$1,300/month

**Command:**
```bash
./deploy-with-waf.sh prod frontdoor Prevention
```

---

## 🔧 Configuration Reference

### Environment Variables
| Parameter | Dev | Staging | Prod | Description |
|-----------|-----|---------|------|-------------|
| App Service SKU | B2 | S1 | P1v3 | Compute tier |
| SQL SKU | Basic | S1 | S3 | Database tier |
| Redis SKU | Basic C0 | Standard C1 | Premium P1 | Cache tier |
| Autoscaling | No | Yes | Yes | Auto-scale enabled |
| Min Replicas | 1 | 2 | 3 | Minimum instances |
| Max Replicas | 2 | 5 | 10 | Maximum instances |
| Log Retention | 30 days | 30 days | 90 days | Log retention |
| Defender | No | No | Yes | Azure Defender |

### Optional Features
| Feature | Parameter | Default | Cost Impact |
|---------|-----------|---------|-------------|
| Application Gateway | `enableApplicationGateway` | false | +$380/month |
| Front Door | `enableFrontDoor` | false | +$405/month |
| Private Endpoints | `enablePrivateEndpoints` | false | +$50-100/month |
| Azure Defender | `enableDefender` | false | +$15-30/month |
| WAF Mode | `wafMode` | Detection | No cost difference |

---

## 📊 Monitoring & Dashboards

### Available Dashboards
1. **Main Monitoring Dashboard** (`jobpilot-{env}-dashboard`)
   - Service health overview
   - Performance metrics
   - Error tracking
   - Resource utilization

2. **WAF Dashboard** (`jobpilot-{env}-dashboard-waf`)
   - Blocked requests
   - Attack patterns
   - Geographic threats

### Alert Categories
1. **Application Performance** - Response times, errors, availability
2. **Infrastructure Health** - CPU, memory, disk, network
3. **Data Layer** - SQL DTU, Redis connections, storage
4. **Security** - WAF blocks, unusual traffic, failed authentications
5. **Business Metrics** - Custom events, user journeys

### Log Analytics Queries
Access at: Azure Portal > Log Analytics Workspace > Saved Queries
- High error rate detection
- Slow request identification
- Dependency failures
- Business metrics
- User journey analysis
- Error analysis with stack traces

---

## 🔒 Security Best Practices

### Required Reading
1. [WAF-MONITORING-README.md](WAF-MONITORING-README.md) - Security section
2. [PRIVATE_NETWORKING.md](PRIVATE_NETWORKING.md) - Network security
3. [keyvault-secrets.md](keyvault-secrets.md) - Secret management

### Security Checklist
- [ ] Enable WAF in Production
- [ ] Use Prevention mode for WAF
- [ ] Configure private endpoints
- [ ] Enable Azure Defender
- [ ] Set up alert notifications
- [ ] Review WAF logs weekly
- [ ] Update OWASP rulesets monthly
- [ ] Rotate secrets regularly
- [ ] Use managed identities
- [ ] Restrict Key Vault access
- [ ] Enable diagnostic logs
- [ ] Configure geo-filtering
- [ ] Test disaster recovery

---

## 💰 Cost Management

### Cost Breakdown by Environment

**Development** (~$150/month):
- App Services: $50
- SQL Database: $15
- Redis Cache: $20
- Other: $65

**Staging** (~$427/month):
- App Services: $200
- SQL Database: $100
- Redis Cache: $55
- Other: $72

**Production Base** (~$827/month):
- App Services: $450
- SQL Database: $200
- Redis Cache: $100
- Other: $77

**Production + WAF** (~$1,200/month):
- Base: $827
- Application Gateway: $380

**Production + Front Door** (~$1,300/month):
- Base: $827
- Front Door Premium: $405
- Global data transfer: ~$70

### Cost Optimization Tips
1. Use App Gateway for single-region (cheaper than Front Door)
2. Adjust availability test frequency (5min → 15min)
3. Reduce log retention in non-prod environments
4. Disable WAF in development
5. Use reserved instances for predictable workloads
6. Enable autoscaling to avoid over-provisioning
7. Review and delete unused resources
8. Use Azure Cost Management alerts

---

## 🆘 Troubleshooting

### Common Issues

**Issue: Deployment fails**
- Check: Template validation errors
- Review: Azure service quotas
- Verify: Subscription permissions
- See: [README.md](README.md) - Troubleshooting section

**Issue: WAF blocking legitimate traffic**
- Check: WAF logs
- Review: Blocked request patterns
- Add: Exclusion rules
- See: [WAF-MONITORING-README.md](WAF-MONITORING-README.md) - Troubleshooting

**Issue: Alerts not firing**
- Verify: Action group configuration
- Check: Alert conditions
- Test: Manual trigger
- See: [WAF-MONITORING-README.md](WAF-MONITORING-README.md) - Alerts section

**Issue: Private endpoints not working**
- Check: DNS resolution
- Verify: Subnet configuration
- Review: NSG rules
- See: [PRIVATE_NETWORKING.md](PRIVATE_NETWORKING.md) - Troubleshooting

---

## 📞 Support & Resources

### Documentation
- Azure Documentation: https://docs.microsoft.com/azure/
- Bicep Documentation: https://docs.microsoft.com/azure/azure-resource-manager/bicep/
- WAF Best Practices: https://docs.microsoft.com/azure/web-application-firewall/
- Monitoring Guide: https://docs.microsoft.com/azure/azure-monitor/

### Community
- Azure Community: https://techcommunity.microsoft.com/t5/azure/ct-p/Azure
- Stack Overflow: https://stackoverflow.com/questions/tagged/azure

### Internal Support
- DevOps Team: devops@jobpilot.ai
- Security Team: security@jobpilot.ai

---

## 🔄 Updates & Changelog

### Latest Changes (December 2025)

**Added:**
- Application Gateway with WAF v2 module
- Azure Front Door Premium with WAF module
- Enhanced monitoring with availability tests
- Pre-configured dashboards
- 13 comprehensive alerts
- 6 Log Analytics saved queries
- Deployment automation scripts
- Comprehensive documentation

**Updated:**
- Monitoring module with new alert types
- Main template with WAF options
- Networking module for App Gateway subnet
- Documentation structure

**See:** [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) for complete details

---

## 📝 Contributing

When adding new features or modules:

1. Create module in `modules/` directory
2. Update `main.bicep` to reference module
3. Add documentation in appropriate MD file
4. Update this INDEX.md
5. Test deployment in dev environment
6. Update cost estimates
7. Add troubleshooting section

---

## 📄 License

This infrastructure code is proprietary to JobPilot AI.

---

**Last Updated:** December 4, 2025
**Version:** 2.0
**Maintainer:** DevOps Team
