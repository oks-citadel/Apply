# ApplyforUs Infrastructure Deployment Checklist

Complete checklist for deploying the ApplyforUs platform infrastructure on Azure.

## Pre-Deployment Phase

### Azure Setup

- [ ] **Azure Subscription Verified**
  - [ ] Active subscription with billing enabled
  - [ ] Subscription ID documented
  - [ ] Contributor or Owner role assigned

- [ ] **Azure CLI Installed**
  - [ ] Version 2.50.0 or higher
  - [ ] Successfully logged in: `az login`
  - [ ] Correct subscription selected: `az account set --subscription "..."`

- [ ] **Service Principal Created** (if not using personal account)
  - [ ] Service principal created
  - [ ] Credentials documented securely
  - [ ] Environment variables set (ARM_CLIENT_ID, ARM_CLIENT_SECRET, etc.)

- [ ] **Resource Quotas Verified**
  - [ ] VM cores available (minimum 8 for dev, 24 for prod)
  - [ ] Public IPs available (minimum 2)
  - [ ] Storage accounts available
  - [ ] Request quota increase if needed

- [ ] **Required Resource Providers Registered**
  ```bash
  az provider register --namespace Microsoft.Compute
  az provider register --namespace Microsoft.Network
  az provider register --namespace Microsoft.ContainerService
  az provider register --namespace Microsoft.ContainerRegistry
  az provider register --namespace Microsoft.KeyVault
  az provider register --namespace Microsoft.Storage
  az provider register --namespace Microsoft.OperationalInsights
  ```

### Local Environment Setup

- [ ] **Terraform Installed**
  - [ ] Version 1.5.0 or higher
  - [ ] `terraform version` command works

- [ ] **kubectl Installed**
  - [ ] Latest version installed
  - [ ] `kubectl version --client` works

- [ ] **Helm Installed**
  - [ ] Version 3.x installed
  - [ ] `helm version` works

- [ ] **Git Repository Cloned**
  - [ ] Repository cloned to local machine
  - [ ] Navigate to: `infrastructure/terraform-applyforus/`

### Terraform Backend Setup

- [ ] **State Storage Account Created**
  ```bash
  az group create --name applyforus-tfstate-rg --location eastus
  az storage account create --name applyforustfstate --resource-group applyforus-tfstate-rg --location eastus --sku Standard_LRS
  az storage container create --name tfstate --account-name applyforustfstate
  ```

- [ ] **Backend Configuration Verified**
  - [ ] `versions.tf` backend block configured
  - [ ] Storage account name is globally unique
  - [ ] Container name correct

### Configuration Files

- [ ] **Environment Variables Reviewed**
  - [ ] Dev configuration: `environments/dev.tfvars`
  - [ ] Test configuration: `environments/test.tfvars`
  - [ ] Prod configuration: `environments/prod.tfvars`

- [ ] **Variables Customized**
  - [ ] Project name set
  - [ ] Locations verified (primary and secondary)
  - [ ] Tags customized
  - [ ] Email addresses updated
  - [ ] IP ranges for allowed access configured

### Domain Setup

- [ ] **Domain Registered**
  - [ ] applyforus.com registered in GoDaddy
  - [ ] Access to GoDaddy account verified
  - [ ] Domain is not locked

- [ ] **Domain Preparation**
  - [ ] Current nameservers documented
  - [ ] Current DNS records exported
  - [ ] TTL reduced to 300 seconds (if changing from existing DNS)

## Deployment Phase

### Terraform Initialization

- [ ] **Terraform Initialized**
  ```bash
  cd infrastructure/terraform-applyforus
  terraform init
  ```

- [ ] **Providers Downloaded**
  - [ ] Azure provider downloaded
  - [ ] Random provider downloaded
  - [ ] Time provider downloaded

- [ ] **Backend Configured**
  - [ ] Remote state storage connected
  - [ ] No initialization errors

### Development Environment Deployment

- [ ] **Plan Reviewed**
  ```bash
  terraform plan -var-file="environments/dev.tfvars"
  ```
  - [ ] Review all resources to be created
  - [ ] Verify naming conventions
  - [ ] Check SKU sizes are correct

- [ ] **Infrastructure Deployed**
  ```bash
  terraform apply -var-file="environments/dev.tfvars"
  ```
  - [ ] Deployment completed successfully
  - [ ] No errors in output
  - [ ] Deployment time: ~30-45 minutes

- [ ] **Outputs Verified**
  ```bash
  terraform output
  ```
  - [ ] Resource group created
  - [ ] AKS cluster created
  - [ ] ACR created
  - [ ] Application Gateway created
  - [ ] DNS zone created
  - [ ] All outputs present

### Test Environment Deployment

- [ ] **Plan Reviewed**
  ```bash
  terraform plan -var-file="environments/test.tfvars"
  ```

- [ ] **Infrastructure Deployed**
  ```bash
  terraform apply -var-file="environments/test.tfvars"
  ```

- [ ] **Outputs Verified**

### Production Environment Deployment

- [ ] **Plan Reviewed Thoroughly**
  ```bash
  terraform plan -var-file="environments/prod.tfvars" -out=prod.tfplan
  ```
  - [ ] All resources reviewed
  - [ ] HA configurations verified
  - [ ] Zone redundancy enabled
  - [ ] Private endpoints configured

- [ ] **Production Deployment Approved**
  - [ ] Plan reviewed by team
  - [ ] Change window scheduled
  - [ ] Rollback plan prepared

- [ ] **Infrastructure Deployed**
  ```bash
  terraform apply prod.tfplan
  ```
  - [ ] Monitor deployment progress
  - [ ] Note any warnings or errors
  - [ ] Deployment time: ~45-60 minutes

- [ ] **Outputs Documented**
  - [ ] All outputs saved to secure location
  - [ ] Sensitive outputs (passwords, keys) stored in Key Vault
  - [ ] DNS nameservers documented

## Post-Deployment Phase

### AKS Cluster Verification

- [ ] **Cluster Credentials Obtained**
  ```bash
  az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-prod-aks
  ```

- [ ] **Cluster Connectivity Verified**
  ```bash
  kubectl cluster-info
  kubectl get nodes
  ```

- [ ] **Nodes Healthy**
  - [ ] All nodes in Ready state
  - [ ] System node pool operational
  - [ ] User node pool operational

- [ ] **Namespaces Created**
  ```bash
  kubectl create namespace jobpilot
  kubectl create namespace cert-manager
  ```

### ACR Verification

- [ ] **ACR Login Successful**
  ```bash
  az acr login --name [acr-name]
  ```

- [ ] **AKS Can Pull from ACR**
  - [ ] Role assignment verified
  - [ ] Test image pushed and pulled

### DNS Configuration

- [ ] **Azure Nameservers Retrieved**
  ```bash
  terraform output dns_zone_nameservers
  ```

- [ ] **GoDaddy Nameservers Updated**
  - [ ] Follow steps in `godaddy_setup_steps.md`
  - [ ] All 4 nameservers entered
  - [ ] Changes saved in GoDaddy

- [ ] **DNS Propagation Monitored**
  - [ ] Check https://www.whatsmydns.net/
  - [ ] Wait 24-48 hours for full propagation
  - [ ] Verify from multiple locations

- [ ] **DNS Records Verified**
  ```bash
  nslookup applyforus.com
  nslookup www.applyforus.com
  nslookup api.applyforus.com
  ```

### SSL Certificate Configuration

- [ ] **cert-manager Installed**
  ```bash
  helm install cert-manager jetstack/cert-manager --namespace cert-manager --set installCRDs=true
  ```

- [ ] **ClusterIssuer Created**
  - [ ] Staging issuer for testing
  - [ ] Production issuer for live certificates
  - [ ] Azure DNS integration configured

- [ ] **Workload Identity Configured**
  - [ ] Managed identity created
  - [ ] DNS Zone Contributor role assigned
  - [ ] Federated credential created

- [ ] **Certificates Requested**
  - [ ] Certificate resources created
  - [ ] ACME challenges completed
  - [ ] Certificates issued successfully

- [ ] **Ingress Configured**
  - [ ] TLS enabled in ingress
  - [ ] Certificate secrets referenced
  - [ ] HTTP to HTTPS redirect enabled

### Application Gateway Configuration

- [ ] **Backend Pool Configured**
  - [ ] Points to AKS ingress controller
  - [ ] Backend health is healthy

- [ ] **SSL Certificate Uploaded** (if not using ingress-level SSL)
  - [ ] Certificate in PFX format
  - [ ] Uploaded to Application Gateway
  - [ ] HTTPS listener configured

- [ ] **WAF Rules Configured**
  - [ ] OWASP rule set enabled
  - [ ] Custom rules added if needed
  - [ ] Prevention mode enabled (production)

### Monitoring Setup

- [ ] **Application Insights Instrumentation Key Retrieved**
  ```bash
  terraform output application_insights_instrumentation_key
  ```

- [ ] **Application Insights Connection String Retrieved**
  ```bash
  terraform output application_insights_connection_string
  ```

- [ ] **Instrumentation Added to Applications**
  - [ ] Web app instrumented
  - [ ] API services instrumented
  - [ ] Connection strings added to secrets

- [ ] **Log Analytics Queries Tested**
  - [ ] Sample queries executed
  - [ ] Logs flowing correctly
  - [ ] Metrics being collected

- [ ] **Alerts Configured**
  - [ ] Email notifications working
  - [ ] Webhook notifications configured (if needed)
  - [ ] Test alert triggered and received

- [ ] **Dashboards Created**
  - [ ] Application overview dashboard
  - [ ] Infrastructure health dashboard
  - [ ] Custom dashboards as needed

### Security Configuration

- [ ] **Key Vault Access Configured**
  - [ ] Application identities have access
  - [ ] Secrets created for applications
  - [ ] Certificate access configured

- [ ] **Network Security Groups Verified**
  - [ ] Rules reviewed
  - [ ] Unnecessary ports closed
  - [ ] Management access restricted

- [ ] **Private Endpoints Operational** (production)
  - [ ] Key Vault private endpoint
  - [ ] ACR private endpoint
  - [ ] Storage private endpoint
  - [ ] DNS resolution working

- [ ] **RBAC Configured**
  - [ ] AKS RBAC enabled
  - [ ] Admin access restricted
  - [ ] Service accounts configured

### Storage Configuration

- [ ] **Storage Containers Created**
  - [ ] Backups container
  - [ ] Logs container
  - [ ] Uploads container
  - [ ] Documents container

- [ ] **Lifecycle Policies Applied**
  - [ ] Old logs deletion configured
  - [ ] Backup retention configured
  - [ ] Tiering policies set

- [ ] **Access Keys Secured**
  - [ ] Keys stored in Key Vault
  - [ ] Access limited via RBAC

### Application Deployment

- [ ] **Container Images Built**
  ```bash
  docker build -t [acr-name].azurecr.io/web-app:v1.0.0 ./apps/web
  docker build -t [acr-name].azurecr.io/auth-service:v1.0.0 ./services/auth-service
  # ... other services
  ```

- [ ] **Images Pushed to ACR**
  ```bash
  docker push [acr-name].azurecr.io/web-app:v1.0.0
  # ... other images
  ```

- [ ] **Kubernetes Manifests Updated**
  - [ ] Image references updated
  - [ ] ConfigMaps configured
  - [ ] Secrets configured
  - [ ] Service accounts configured

- [ ] **Applications Deployed**
  ```bash
  kubectl apply -f infrastructure/kubernetes/
  ```

- [ ] **Deployments Verified**
  ```bash
  kubectl get deployments -n jobpilot
  kubectl get pods -n jobpilot
  kubectl get services -n jobpilot
  ```

### Testing Phase

- [ ] **Health Endpoints Tested**
  - [ ] Web app health check: https://applyforus.com/health
  - [ ] API health check: https://api.applyforus.com/health

- [ ] **SSL Certificate Verified**
  - [ ] Certificate valid
  - [ ] Certificate chain complete
  - [ ] No browser warnings
  - [ ] SSL Labs grade: A or A+

- [ ] **Application Functionality Tested**
  - [ ] User registration working
  - [ ] User login working
  - [ ] Core features operational
  - [ ] API endpoints responding

- [ ] **Performance Tested**
  - [ ] Load testing completed
  - [ ] Response times acceptable
  - [ ] Auto-scaling triggered correctly

- [ ] **Monitoring Verified**
  - [ ] Logs appearing in Log Analytics
  - [ ] Metrics in Application Insights
  - [ ] Alerts triggering correctly

### Documentation

- [ ] **Infrastructure Details Documented**
  - [ ] Resource names
  - [ ] IP addresses
  - [ ] Connection strings (in secure location)
  - [ ] Deployment date and time

- [ ] **Access Information Documented**
  - [ ] Azure Portal access
  - [ ] AKS cluster access
  - [ ] ACR access
  - [ ] Monitoring dashboards

- [ ] **Runbooks Created**
  - [ ] Common operations documented
  - [ ] Troubleshooting guide updated
  - [ ] Incident response procedures

### Backup and DR

- [ ] **Terraform State Backed Up**
  ```bash
  terraform state pull > terraform-state-backup-$(date +%Y%m%d).json
  ```

- [ ] **DNS Configuration Exported**
  ```bash
  az network dns record-set list --resource-group applyforus-prod-rg --zone-name applyforus.com --output json > dns-backup.json
  ```

- [ ] **Kubernetes Configuration Backed Up**
  ```bash
  kubectl get all --all-namespaces -o yaml > k8s-backup.yaml
  ```

- [ ] **Disaster Recovery Plan Documented**
  - [ ] RTO and RPO defined
  - [ ] Recovery procedures documented
  - [ ] Backup schedules configured

## Go-Live Phase

### Pre-Go-Live Checks

- [ ] **All Systems Green**
  - [ ] Infrastructure healthy
  - [ ] Applications running
  - [ ] Monitoring active
  - [ ] SSL certificates valid

- [ ] **DNS Fully Propagated**
  - [ ] Verified from multiple locations
  - [ ] Old DNS records removed/updated

- [ ] **Team Notified**
  - [ ] Go-live time communicated
  - [ ] On-call schedule established
  - [ ] Escalation procedures reviewed

### Go-Live

- [ ] **Final Smoke Tests**
  - [ ] All critical paths tested
  - [ ] No errors in logs
  - [ ] Performance acceptable

- [ ] **Traffic Monitoring**
  - [ ] Monitor Application Insights
  - [ ] Watch for errors
  - [ ] Check response times

- [ ] **User Communications**
  - [ ] Users notified of new URL (if applicable)
  - [ ] Documentation updated
  - [ ] Support team briefed

### Post-Go-Live

- [ ] **24-Hour Monitoring**
  - [ ] Watch for issues
  - [ ] Monitor error rates
  - [ ] Track performance metrics

- [ ] **User Feedback Collected**
  - [ ] Issues reported and tracked
  - [ ] Performance feedback gathered

- [ ] **Go-Live Review Meeting**
  - [ ] What went well
  - [ ] What could be improved
  - [ ] Action items documented

## Ongoing Maintenance

### Daily

- [ ] Monitor dashboards for anomalies
- [ ] Review error logs
- [ ] Check alert notifications

### Weekly

- [ ] Review cost reports
- [ ] Check for security updates
- [ ] Review performance trends
- [ ] Verify backups completed

### Monthly

- [ ] Review and optimize costs
- [ ] Update documentation
- [ ] Review access controls
- [ ] Test disaster recovery procedures
- [ ] Update dependencies

### Quarterly

- [ ] AKS version upgrade
- [ ] Security audit
- [ ] Capacity planning review
- [ ] Disaster recovery drill

## Sign-Off

### Deployment Sign-Off

- [ ] **Infrastructure Team Lead**: _________________ Date: _______
- [ ] **Application Team Lead**: _________________ Date: _______
- [ ] **Security Team Lead**: _________________ Date: _______
- [ ] **Operations Manager**: _________________ Date: _______

### Notes

```
Add any deployment-specific notes, issues encountered, or deviations from the plan:




```

---

**Document Version**: 1.0
**Last Updated**: 2024-12-08
**Next Review Date**: [Set date]
