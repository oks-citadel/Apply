# Azure DevOps CI/CD Setup Guide
## JobPilot AI Platform

**Organization:** citadelcloudmanagement
**Project:** ApplyPlatform
**Repository:** ApplyPlatform
**Date:** December 2024

---

## 1. Overview

This document provides comprehensive setup instructions for the Azure DevOps CI/CD pipeline for the JobPilot AI Platform. The pipeline supports:

- Multi-stage deployment (Dev → Staging → Production)
- Docker image building and pushing
- Kubernetes deployment
- Automated testing (Unit, Integration, E2E)
- Security scanning
- Canary deployments
- Automated rollback

---

## 2. Prerequisites

### 2.1 Azure Resources Required

| Resource | Purpose | Status |
|----------|---------|--------|
| Azure Container Registry | Docker images | Required |
| Azure Kubernetes Service | Container hosting | Required |
| Azure Key Vault | Secrets management | Required |
| Azure PostgreSQL | Database | Required |
| Azure Redis Cache | Caching | Required |
| Azure Service Bus | Messaging | Required |
| Azure Application Insights | APM | Required |

### 2.2 Azure DevOps Setup

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Configure defaults
az devops configure --defaults organization=https://dev.azure.com/citadelcloudmanagement project=ApplyPlatform

# Login
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

---

## 3. Service Connections

### 3.1 Create Azure Resource Manager Connection

```bash
# Create service principal for Azure resources
az ad sp create-for-rbac \
  --name "jobpilot-devops-sp" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/applyplatform-rg \
  --sdk-auth

# Create service connection in Azure DevOps
az devops service-endpoint azurerm create \
  --azure-rm-service-principal-id <SP_CLIENT_ID> \
  --azure-rm-subscription-id <SUBSCRIPTION_ID> \
  --azure-rm-subscription-name "<SUBSCRIPTION_NAME>" \
  --azure-rm-tenant-id <TENANT_ID> \
  --name "azure-connection"
```

### 3.2 Create Docker Registry Connection

```bash
# Get ACR credentials
az acr credential show --name citadelplatforms

# Create service connection
az devops service-endpoint create \
  --service-endpoint-type dockerregistry \
  --service-endpoint-url "https://citadelplatforms.azurecr.io" \
  --name "acr-connection"
```

### 3.3 Create Kubernetes Connection

```bash
# Get AKS credentials
az aks get-credentials --resource-group applyplatform-rg --name applyplatform-aks

# Create service connection
az devops service-endpoint kubernetes create \
  --kubernetes-url "https://<AKS_API_SERVER>" \
  --name "aks-connection" \
  --authorization-type "ServiceAccount"
```

---

## 4. Variable Groups

### 4.1 Create Common Variables

```bash
# Create variable group
az pipelines variable-group create \
  --name "jobpilot-common" \
  --variables \
    NODE_VERSION="20" \
    PYTHON_VERSION="3.11" \
    TF_VERSION="1.6.0" \
    ACR_NAME="citadelplatforms" \
    IMAGE_PREFIX="applyai"

# Create environment-specific variable groups
az pipelines variable-group create --name "jobpilot-dev" --variables \
  K8S_NAMESPACE="jobpilot-dev" \
  REPLICAS="1" \
  INGRESS_HOST="dev.jobpilot.io"

az pipelines variable-group create --name "jobpilot-staging" --variables \
  K8S_NAMESPACE="jobpilot-staging" \
  REPLICAS="2" \
  INGRESS_HOST="staging.jobpilot.io"

az pipelines variable-group create --name "jobpilot-prod" --variables \
  K8S_NAMESPACE="jobpilot-prod" \
  REPLICAS="3" \
  INGRESS_HOST="jobpilot.io"
```

### 4.2 Link Key Vault Secrets

```bash
# Create variable group linked to Key Vault
az pipelines variable-group create \
  --name "jobpilot-secrets" \
  --authorize true \
  --type AzureKeyVault \
  --azure-key-vault-name "jobpilot-kv"
```

---

## 5. Pipeline Configuration

### 5.1 Main CI/CD Pipeline

```yaml
# azure-pipelines-main.yml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    exclude:
      - docs/**
      - '*.md'

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: jobpilot-common
  - group: jobpilot-secrets
  - name: isMain
    value: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  - name: isDevelop
    value: $[eq(variables['Build.SourceBranch'], 'refs/heads/develop')]

stages:
  # ===========================
  # STAGE 1: Build & Validate
  # ===========================
  - stage: Build
    displayName: 'Build & Validate'
    jobs:
      - job: Validate
        displayName: 'Lint, Type Check, Test'
        steps:
          - task: NodeTool@0
            displayName: 'Install Node.js'
            inputs:
              versionSpec: '$(NODE_VERSION)'

          - task: Cache@2
            displayName: 'Cache pnpm dependencies'
            inputs:
              key: 'pnpm | "$(Agent.OS)" | pnpm-lock.yaml'
              path: $(Pipeline.Workspace)/.pnpm-store
              restoreKeys: |
                pnpm | "$(Agent.OS)"

          - script: |
              npm install -g pnpm@8
              pnpm config set store-dir $(Pipeline.Workspace)/.pnpm-store
              pnpm install --frozen-lockfile
            displayName: 'Install dependencies'

          - script: pnpm run lint
            displayName: 'Run linting'

          - script: pnpm run type-check
            displayName: 'Run type checking'

          - script: pnpm run test -- --coverage --ci
            displayName: 'Run unit tests'

          - task: PublishTestResults@2
            displayName: 'Publish test results'
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/junit.xml'
              mergeTestResults: true

          - task: PublishCodeCoverageResults@1
            displayName: 'Publish code coverage'
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'

  # ===========================
  # STAGE 2: Security Scanning
  # ===========================
  - stage: Security
    displayName: 'Security Scanning'
    dependsOn: Build
    jobs:
      - job: SecurityScan
        displayName: 'Security Analysis'
        steps:
          - task: SnykSecurityScan@1
            displayName: 'Snyk dependency scan'
            inputs:
              serviceConnectionEndpoint: 'snyk-connection'
              testType: 'app'
              failOnIssues: false

          - task: Trivy@0
            displayName: 'Trivy filesystem scan'
            inputs:
              version: 'latest'
              path: '$(System.DefaultWorkingDirectory)'
              exitCode: '0'

  # ===========================
  # STAGE 3: Build Docker Images
  # ===========================
  - stage: BuildImages
    displayName: 'Build Docker Images'
    dependsOn: Security
    jobs:
      - job: BuildAllImages
        displayName: 'Build All Service Images'
        steps:
          - task: Docker@2
            displayName: 'Login to ACR'
            inputs:
              containerRegistry: 'acr-connection'
              command: 'login'

          - script: |
              TAG=$(Build.BuildId)

              # Build all images in parallel
              docker compose -f docker-compose.build.yml build --parallel

              # Tag and push all images
              for service in web auth-service user-service resume-service job-service \
                           auto-apply-service notification-service analytics-service \
                           ai-service orchestrator-service; do
                docker tag $(ACR_NAME)/$(IMAGE_PREFIX):${service}-latest \
                           $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):${service}-$(TAG)
                docker push $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):${service}-$(TAG)

                # Also push latest for dev
                docker tag $(ACR_NAME)/$(IMAGE_PREFIX):${service}-latest \
                           $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):${service}-latest
                docker push $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):${service}-latest
              done
            displayName: 'Build and push images'

          - task: Trivy@0
            displayName: 'Scan container images'
            inputs:
              version: 'latest'
              image: '$(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):web-$(Build.BuildId)'
              exitCode: '0'

  # ===========================
  # STAGE 4: Deploy to Dev
  # ===========================
  - stage: DeployDev
    displayName: 'Deploy to Development'
    dependsOn: BuildImages
    condition: and(succeeded(), eq(variables.isDevelop, true))
    variables:
      - group: jobpilot-dev
    jobs:
      - deployment: DeployDev
        displayName: 'Deploy to Dev Environment'
        environment: 'jobpilot-dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  displayName: 'Deploy to Kubernetes'
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-connection'
                    namespace: '$(K8S_NAMESPACE)'
                    manifests: |
                      infrastructure/kubernetes/overlays/dev/*.yaml
                    containers: |
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):web-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):auth-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):user-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):resume-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):job-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):auto-apply-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):notification-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):analytics-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):ai-service-$(Build.BuildId)
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):orchestrator-service-$(Build.BuildId)

                - script: |
                    # Wait for deployments
                    kubectl rollout status deployment --all -n $(K8S_NAMESPACE) --timeout=300s
                  displayName: 'Wait for deployments'

                - script: |
                    # Run smoke tests
                    ./scripts/smoke-tests.sh $(INGRESS_HOST)
                  displayName: 'Run smoke tests'

  # ===========================
  # STAGE 5: Deploy to Staging
  # ===========================
  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: DeployDev
    condition: and(succeeded(), eq(variables.isDevelop, true))
    variables:
      - group: jobpilot-staging
    jobs:
      - deployment: DeployStaging
        displayName: 'Deploy to Staging Environment'
        environment: 'jobpilot-staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  displayName: 'Deploy to Kubernetes'
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-connection'
                    namespace: '$(K8S_NAMESPACE)'
                    manifests: |
                      infrastructure/kubernetes/overlays/staging/*.yaml
                    containers: |
                      $(ACR_NAME).azurecr.io/$(IMAGE_PREFIX):web-$(Build.BuildId)

                - script: |
                    kubectl rollout status deployment --all -n $(K8S_NAMESPACE) --timeout=300s
                  displayName: 'Wait for deployments'

                - script: |
                    ./scripts/integration-tests.sh $(INGRESS_HOST)
                  displayName: 'Run integration tests'

  # ===========================
  # STAGE 6: Deploy to Production
  # ===========================
  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: and(succeeded(), eq(variables.isMain, true))
    variables:
      - group: jobpilot-prod
    jobs:
      - deployment: DeployProdCanary
        displayName: 'Canary Deployment'
        environment: 'jobpilot-prod'
        strategy:
          canary:
            increments: [10, 30, 60, 100]
            deploy:
              steps:
                - task: KubernetesManifest@0
                  displayName: 'Deploy canary'
                  inputs:
                    action: 'deploy'
                    kubernetesServiceConnection: 'aks-connection'
                    namespace: '$(K8S_NAMESPACE)'
                    strategy: 'canary'
                    percentage: '$(strategy.increment)'
                    manifests: |
                      infrastructure/kubernetes/overlays/prod/*.yaml

            routeTraffic:
              steps:
                - script: |
                    # Shift traffic to canary
                    kubectl patch service web-app -n $(K8S_NAMESPACE) \
                      -p '{"spec":{"selector":{"track":"canary"}}}'
                  displayName: 'Route traffic to canary'

            postRouteTraffic:
              steps:
                - script: |
                    # Monitor canary health
                    ./scripts/canary-health-check.sh $(INGRESS_HOST) $(strategy.increment)
                  displayName: 'Monitor canary health'

            on:
              failure:
                steps:
                  - script: |
                      # Rollback on failure
                      kubectl rollout undo deployment --all -n $(K8S_NAMESPACE)
                    displayName: 'Rollback on failure'

              success:
                steps:
                  - script: |
                      echo "Canary deployment successful at $(strategy.increment)%"
                    displayName: 'Log success'
```

### 5.2 Rollback Pipeline

```yaml
# azure-pipelines-rollback.yml
trigger: none
pr: none

parameters:
  - name: environment
    displayName: 'Environment to rollback'
    type: string
    default: 'staging'
    values:
      - dev
      - staging
      - prod
  - name: revisionCount
    displayName: 'Number of revisions to rollback'
    type: number
    default: 1

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Rollback
    displayName: 'Rollback ${{ parameters.environment }}'
    jobs:
      - deployment: Rollback
        displayName: 'Execute Rollback'
        environment: 'jobpilot-${{ parameters.environment }}'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureCLI@2
                  displayName: 'Get AKS credentials'
                  inputs:
                    azureSubscription: 'azure-connection'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az aks get-credentials --resource-group applyplatform-rg --name applyplatform-aks

                - script: |
                    NAMESPACE="jobpilot-${{ parameters.environment }}"

                    echo "Rolling back all deployments in $NAMESPACE..."

                    # Get all deployments
                    DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')

                    for deployment in $DEPLOYMENTS; do
                      echo "Rolling back $deployment..."
                      kubectl rollout undo deployment/$deployment -n $NAMESPACE --to-revision=${{ parameters.revisionCount }}
                    done

                    # Wait for rollback to complete
                    kubectl rollout status deployment --all -n $NAMESPACE --timeout=300s

                    echo "Rollback complete!"
                  displayName: 'Execute rollback'

                - script: |
                    # Run smoke tests to verify rollback
                    ./scripts/smoke-tests.sh ${{ parameters.environment }}.jobpilot.io
                  displayName: 'Verify rollback'
```

---

## 6. Environments Setup

### 6.1 Create Environments

```bash
# Create environments
az pipelines environment create --name "jobpilot-dev"
az pipelines environment create --name "jobpilot-staging"
az pipelines environment create --name "jobpilot-prod"
```

### 6.2 Configure Approvals

For production environment, configure manual approvals:

1. Navigate to: **Azure DevOps** → **Pipelines** → **Environments**
2. Select **jobpilot-prod**
3. Click **Approvals and checks**
4. Add **Approvals**:
   - Required approvers: Platform team leads
   - Timeout: 72 hours
   - Allow approvers to approve their own runs: No

### 6.3 Configure Branch Policies

```bash
# Require PR for main branch
az repos policy create \
  --repository-id ApplyPlatform \
  --branch main \
  --blocking true \
  --enabled true \
  --policy-type RequiredReviewers \
  --required-reviewer-ids "<TEAM_ID>"

# Require build validation
az repos policy build create \
  --repository-id ApplyPlatform \
  --branch main \
  --build-definition-id <BUILD_ID> \
  --blocking true \
  --enabled true \
  --display-name "CI Build"
```

---

## 7. Pipeline Templates

### 7.1 Reusable Build Template

```yaml
# templates/build-service.yml
parameters:
  - name: serviceName
    type: string
  - name: dockerfilePath
    type: string
    default: ''

steps:
  - task: Docker@2
    displayName: 'Build ${{ parameters.serviceName }}'
    inputs:
      containerRegistry: 'acr-connection'
      repository: '$(IMAGE_PREFIX)/${{ parameters.serviceName }}'
      command: 'buildAndPush'
      Dockerfile: '${{ coalesce(parameters.dockerfilePath, format(''services/{0}/Dockerfile'', parameters.serviceName)) }}'
      tags: |
        $(Build.BuildId)
        latest
```

### 7.2 Reusable Deploy Template

```yaml
# templates/deploy-service.yml
parameters:
  - name: environment
    type: string
  - name: namespace
    type: string

steps:
  - task: KubernetesManifest@0
    displayName: 'Deploy to ${{ parameters.environment }}'
    inputs:
      action: 'deploy'
      kubernetesServiceConnection: 'aks-connection'
      namespace: '${{ parameters.namespace }}'
      manifests: |
        infrastructure/kubernetes/overlays/${{ parameters.environment }}/*.yaml
```

---

## 8. Monitoring & Alerts

### 8.1 Pipeline Notifications

```bash
# Create notification subscription
az devops service-endpoint create \
  --service-endpoint-type slack \
  --name "slack-notifications" \
  --service-endpoint-url "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### 8.2 Build Badges

Add to README.md:
```markdown
[![Build Status](https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_apis/build/status/CI-Pipeline?branchName=main)](https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build/latest?definitionId=1&branchName=main)
```

---

## 9. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| ACR login fails | Check service connection permissions |
| K8s deploy fails | Verify namespace exists |
| Tests timeout | Increase timeout in pipeline |
| Image not found | Check image tag format |

### Debug Commands

```bash
# View pipeline runs
az pipelines runs list --pipeline-id <PIPELINE_ID>

# View specific run logs
az pipelines runs show --id <RUN_ID>

# Cancel a run
az pipelines run cancel --run-id <RUN_ID>

# Re-run failed stage
az pipelines run --id <PIPELINE_ID> --stage-to-retry <STAGE_NAME>
```

---

## 10. Quick Start Commands

```bash
# Clone and setup
git clone https://dev.azure.com/citadelcloudmanagement/_git/ApplyPlatform
cd ApplyPlatform

# Install dependencies
npm install -g pnpm@8
pnpm install

# Run locally
pnpm run dev

# Run tests
pnpm run test

# Build Docker images
docker compose -f docker-compose.build.yml build

# Trigger pipeline manually
az pipelines run --name "CI-Pipeline" --branch develop
```

---

*Document generated as part of Multi-Agent Orchestration System*
*Date: December 2024*
