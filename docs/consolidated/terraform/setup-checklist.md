# Azure DevOps Pipeline Setup Checklist

Use this checklist to ensure all prerequisites are configured correctly before running the Terraform pipeline.

## Pre-Deployment Checklist

### ☐ Phase 1: Azure Backend Setup (One-time)

#### 1.1 Create Resource Group
```bash
az group create \
  --name jobpilot-terraform-backend \
  --location eastus
```
- [ ] Resource group created
- [ ] Location confirmed: `eastus`
- [ ] Resource group name: `jobpilot-terraform-backend`

#### 1.2 Create Storage Account
```bash
az storage account create \
  --name jobpilotterraform \
  --resource-group jobpilot-terraform-backend \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false
```
- [ ] Storage account created
- [ ] Storage account name: `jobpilotterraform`
- [ ] SKU: Standard_LRS
- [ ] Encryption enabled
- [ ] Public access disabled

#### 1.3 Create Container
```bash
az storage container create \
  --name tfstate \
  --account-name jobpilotterraform \
  --public-access off
```
- [ ] Container created
- [ ] Container name: `tfstate`
- [ ] Public access: Off

#### 1.4 Verify Backend
```bash
az storage account show \
  --name jobpilotterraform \
  --resource-group jobpilot-terraform-backend

az storage container show \
  --name tfstate \
  --account-name jobpilotterraform
```
- [ ] Storage account accessible
- [ ] Container accessible

---

### ☐ Phase 2: Service Principal Setup (One-time)

#### 2.1 Get Subscription ID
```bash
az account show --query id -o tsv
```
- [ ] Subscription ID retrieved
- [ ] Note: `_________________________________`

#### 2.2 Create Service Principal
```bash
az ad sp create-for-rbac \
  --name jobpilot-terraform-sp \
  --role Contributor \
  --scopes /subscriptions/{YOUR-SUBSCRIPTION-ID}
```
- [ ] Service principal created
- [ ] Record credentials:
  - ARM_CLIENT_ID (appId): `_________________________________`
  - ARM_CLIENT_SECRET (password): `_________________________________`
  - ARM_TENANT_ID (tenant): `_________________________________`

#### 2.3 Verify Service Principal
```bash
az login --service-principal \
  --username $ARM_CLIENT_ID \
  --password $ARM_CLIENT_SECRET \
  --tenant $ARM_TENANT_ID

az account show
```
- [ ] Service principal can authenticate
- [ ] Correct subscription shown

#### 2.4 Grant Additional Permissions (if needed)
```bash
# If deploying to multiple subscriptions or resource groups
az role assignment create \
  --assignee $ARM_CLIENT_ID \
  --role Contributor \
  --scope /subscriptions/{SUBSCRIPTION-ID}
```
- [ ] Permissions granted
- [ ] Role: Contributor
- [ ] Scope verified

---

### ☐ Phase 3: Azure DevOps Variable Groups

#### 3.1 Create Variable Group: terraform-backend
Navigate to: **Pipelines → Library → + Variable group**

Create variable group named: `terraform-backend`

Add the following variables:
- [ ] `BACKEND_STORAGE_ACCOUNT` = `jobpilotterraform`
- [ ] `BACKEND_CONTAINER_NAME` = `tfstate`
- [ ] `BACKEND_RESOURCE_GROUP` = `jobpilot-terraform-backend`

Settings:
- [ ] Allow access to all pipelines (optional)
- [ ] Save variable group

#### 3.2 Create Variable Group: terraform-credentials
Create variable group named: `terraform-credentials`

Add the following variables (mark ALL as secret):
- [ ] `ARM_CLIENT_ID` = `<from-sp-output>` 🔒
- [ ] `ARM_CLIENT_SECRET` = `<from-sp-output>` 🔒 Secret
- [ ] `ARM_SUBSCRIPTION_ID` = `<your-subscription-id>` 🔒
- [ ] `ARM_TENANT_ID` = `<from-sp-output>` 🔒
- [ ] `SQL_ADMIN_USERNAME` = `jobpilotadmin` 🔒 Secret
- [ ] `SQL_ADMIN_PASSWORD_DEV` = `<strong-password>` 🔒 Secret
- [ ] `SQL_ADMIN_PASSWORD_STAGING` = `<strong-password>` 🔒 Secret
- [ ] `SQL_ADMIN_PASSWORD_PROD` = `<strong-password>` 🔒 Secret

Password Requirements:
- Minimum 16 characters
- Include uppercase, lowercase, numbers, special characters
- Different password for each environment

Settings:
- [ ] All variables marked as secret (lock icon)
- [ ] Allow access to all pipelines (optional)
- [ ] Save variable group

---

### ☐ Phase 4: Azure DevOps Environments

Navigate to: **Pipelines → Environments → New environment**

#### 4.1 Create Development Environment
- [ ] Environment name: `dev`
- [ ] Description: Development environment for testing
- [ ] Resource: None
- [ ] Approvals: None required

#### 4.2 Create Staging Environment
- [ ] Environment name: `staging`
- [ ] Description: Staging environment for pre-production testing
- [ ] Resource: None
- [ ] Approvals (optional):
  - [ ] Add 1-2 approvers
  - [ ] Timeout: 24 hours
  - [ ] Instructions for approvers documented

#### 4.3 Create Production Environment
- [ ] Environment name: `prod`
- [ ] Description: Production environment
- [ ] Resource: None
- [ ] **Approvals (mandatory)**:
  - [ ] Add 2+ approvers (recommended)
  - [ ] Timeout: 24 hours
  - [ ] Allow approvers to approve their own runs: No
  - [ ] Require all approvers: No (any one approver can approve)
  - [ ] Instructions for approvers: Document review requirements

#### 4.4 Configure Environment Protection
For **prod** environment:
- [ ] Navigate to: Environments → prod → Approvals and checks
- [ ] Add "Approvals" check
- [ ] Configure approvers
- [ ] Optionally add:
  - [ ] Branch control (only allow main branch)
  - [ ] Business hours restriction
  - [ ] Required template validation

---

### ☐ Phase 5: Azure DevOps Pipeline Creation

#### 5.1 Create Pipeline
Navigate to: **Pipelines → New pipeline**

- [ ] Connect: Azure Repos Git (or your repo type)
- [ ] Select: Your repository
- [ ] Configure: Existing Azure Pipelines YAML file
- [ ] Path: `/infrastructure/terraform/azure-pipelines-terraform.yml`
- [ ] Review pipeline YAML
- [ ] Variables correctly configured

#### 5.2 Configure Pipeline Settings
- [ ] Pipeline name: `Terraform - Infrastructure Deployment`
- [ ] Triggers configured (main and develop branches)
- [ ] PR triggers configured
- [ ] Path filters applied

#### 5.3 Link Variable Groups
- [ ] Link `terraform-backend` variable group
- [ ] Link `terraform-credentials` variable group
- [ ] Verify variables accessible in pipeline

---

### ☐ Phase 6: Repository Setup

#### 6.1 Branch Protection
Configure branch policies for `main`:
- [ ] Require pull request reviews (1+ reviewer)
- [ ] Require build validation (pipeline must pass)
- [ ] Block force push
- [ ] Require linear history

Configure branch policies for `develop`:
- [ ] Require pull request reviews (optional)
- [ ] Require build validation

#### 6.2 Repository Structure
Verify files exist:
- [ ] `infrastructure/terraform/azure-pipelines-terraform.yml`
- [ ] `infrastructure/terraform/.tfsec.yml`
- [ ] `infrastructure/terraform/.checkov.yaml`
- [ ] `infrastructure/terraform/environments/dev.tfvars`
- [ ] `infrastructure/terraform/environments/staging.tfvars`
- [ ] `infrastructure/terraform/environments/prod.tfvars`
- [ ] `infrastructure/terraform/scripts/terraform-init.sh` (executable)
- [ ] `infrastructure/terraform/scripts/terraform-plan.sh` (executable)
- [ ] `infrastructure/terraform/scripts/terraform-apply.sh` (executable)

---

### ☐ Phase 7: Security Configuration

#### 7.1 Review Security Settings
- [ ] Service principal has minimal required permissions
- [ ] Variable groups secured (secret variables locked)
- [ ] Environment approvals configured
- [ ] Branch protection enabled
- [ ] Audit logging enabled

#### 7.2 Update IP Allowlists
Edit environment tfvars files and add your IP addresses:

**dev.tfvars:**
```hcl
allowed_ip_addresses = [
  "YOUR.OFFICE.IP.ADDRESS/32",
  "YOUR.VPN.IP.ADDRESS/32",
]
```

**staging.tfvars and prod.tfvars:** Same as above

- [ ] Dev IP allowlist updated
- [ ] Staging IP allowlist updated
- [ ] Prod IP allowlist updated

#### 7.3 Review Security Scanners
- [ ] tfsec configuration reviewed (`.tfsec.yml`)
- [ ] Checkov configuration reviewed (`.checkov.yaml`)
- [ ] Exclusions documented and justified

---

### ☐ Phase 8: Local Testing (Optional but Recommended)

#### 8.1 Install Tools
```bash
# Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# tfsec
curl -s https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash

# Checkov
pip install checkov
```
- [ ] Terraform installed (version 1.6.0)
- [ ] tfsec installed
- [ ] Checkov installed

#### 8.2 Run Local Validation
```bash
cd infrastructure/terraform

# Format check
terraform fmt -check -recursive

# Validation
bash scripts/terraform-init.sh dev
terraform validate

# Security scans
tfsec .
checkov -d . --config-file .checkov.yaml
```
- [ ] Format check passed
- [ ] Validation passed
- [ ] tfsec scan reviewed
- [ ] Checkov scan reviewed
- [ ] Critical issues resolved

---

### ☐ Phase 9: First Deployment Test

#### 9.1 Deploy to Development
- [ ] Commit Terraform files to `develop` branch
- [ ] Push to remote repository
- [ ] Pipeline triggered automatically
- [ ] Validate stage passed
- [ ] Plan dev stage passed
- [ ] Review plan output
- [ ] Apply dev stage completed
- [ ] Verify infrastructure in Azure Portal

#### 9.2 Verify Development Deployment
- [ ] Resource group created
- [ ] Virtual network deployed
- [ ] App Service Plan deployed
- [ ] App Services deployed
- [ ] SQL Server and Database deployed
- [ ] Redis Cache deployed
- [ ] Key Vault deployed
- [ ] Container Registry deployed
- [ ] Application Insights deployed
- [ ] All resources tagged correctly

#### 9.3 Test Development Environment
- [ ] App Services accessible
- [ ] Database connection successful
- [ ] Redis Cache accessible
- [ ] Key Vault accessible
- [ ] Application Insights receiving data
- [ ] No deployment errors

---

### ☐ Phase 10: Documentation and Communication

#### 10.1 Team Documentation
- [ ] Share PIPELINE-README.md with team
- [ ] Share QUICK-START.md with team
- [ ] Document approval process
- [ ] Document rollback procedures
- [ ] Create runbook for common operations

#### 10.2 Team Training
- [ ] Train team on pipeline usage
- [ ] Train approvers on approval process
- [ ] Document on-call procedures
- [ ] Schedule training sessions
- [ ] Create troubleshooting guide

#### 10.3 Monitoring Setup
- [ ] Configure Azure Monitor alerts
- [ ] Set up cost alerts
- [ ] Configure security alerts
- [ ] Set up Azure DevOps notifications
- [ ] Document monitoring dashboard

---

## Post-Deployment Checklist

### ☐ After First Successful Deployment

- [ ] Verify all resources deployed correctly
- [ ] Test connectivity to all services
- [ ] Verify security configurations
- [ ] Review cost estimates
- [ ] Document any issues encountered
- [ ] Update documentation as needed

### ☐ Ongoing Maintenance

- [ ] Schedule regular pipeline reviews (monthly)
- [ ] Review security scan results
- [ ] Monitor infrastructure costs
- [ ] Update Terraform version (quarterly)
- [ ] Rotate service principal credentials (quarterly)
- [ ] Review and update documentation

---

## Rollback Plan

In case of deployment failure:

1. **Stop Pipeline**
   - [ ] Cancel running pipeline if needed

2. **Assess Damage**
   - [ ] Check Azure Portal for failed resources
   - [ ] Review pipeline logs
   - [ ] Identify root cause

3. **Rollback Options**
   - [ ] Option A: Revert Git commit and re-run pipeline
   - [ ] Option B: Manual rollback in Azure Portal
   - [ ] Option C: Terraform state rollback (advanced)

4. **Post-Incident**
   - [ ] Document incident
   - [ ] Update procedures
   - [ ] Communicate to team

---

## Support Contacts

- **Azure Support**: Portal support tickets
- **DevOps Team**: devops@jobpilot.com
- **On-Call Engineer**: Available 24/7
- **Slack**: #infrastructure-support

---

## Approval Sign-Off

### Development Environment Setup
- [ ] Completed by: _________________ Date: _________
- [ ] Reviewed by: _________________ Date: _________

### Staging Environment Setup
- [ ] Completed by: _________________ Date: _________
- [ ] Reviewed by: _________________ Date: _________

### Production Environment Setup
- [ ] Completed by: _________________ Date: _________
- [ ] Reviewed by: _________________ Date: _________
- [ ] Approved by: _________________ Date: _________

---

**Document Version**: 1.0.0
**Last Updated**: 2025-12-04
**Next Review**: 2026-01-04
