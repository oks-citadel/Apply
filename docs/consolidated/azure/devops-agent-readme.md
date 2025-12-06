# Azure DevOps Self-Hosted Agent Setup

## Problem
The Azure DevOps organization requires **Microsoft-hosted parallel job capacity** to run pipelines on hosted agents (`ubuntu-latest`). New Azure DevOps organizations don't have this by default.

**Error Message:**
```
No hosted parallelism has been purchased or granted. To request a free parallelism grant, please fill out the following form https://aka.ms/azpipelines-parallelism-request
```

## Solutions

### Option 1: Request Free Parallelism (Recommended for Production)
1. Visit: https://aka.ms/azpipelines-parallelism-request
2. Fill out the form to request free Microsoft-hosted parallel jobs
3. Wait 2-3 business days for approval
4. Once approved, revert the pipeline to use `vmImage: 'ubuntu-latest'`

### Option 2: Set Up Self-Hosted Agent (Immediate)
Use a self-hosted agent running in Azure Container Instance.

#### Prerequisites
- Azure CLI logged in
- Azure DevOps Personal Access Token (PAT) with "Agent Pools (Read & Manage)" scope

#### Create a PAT
1. Go to Azure DevOps: https://dev.azure.com/citadelcloudmanagement/_usersSettings/tokens
2. Click **"New Token"**
3. Configure:
   - **Name:** DevOps Agent
   - **Scopes:** Agent Pools (Read & Manage)
4. Click **Create** and copy the token

#### Deploy the Agent
```bash
# Set your PAT token
export AZP_TOKEN="your-pat-token-here"

# Deploy the container
az container create \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "terraform-agent-1" \
    --image "mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-22.04" \
    --os-type Linux \
    --cpu 2 \
    --memory 4 \
    --restart-policy Always \
    --environment-variables \
        AZP_URL="https://dev.azure.com/citadelcloudmanagement" \
        AZP_POOL="Default" \
        AZP_AGENT_NAME="terraform-agent-1" \
    --secure-environment-variables \
        AZP_TOKEN="$AZP_TOKEN"
```

#### Verify Agent Registration
1. Go to: https://dev.azure.com/citadelcloudmanagement/_settings/agentpools?poolId=1
2. Check that `terraform-agent-1` appears in the agent list
3. Status should be "Online"

#### Run the Pipeline
```bash
# Trigger the Terraform pipeline on develop branch
az pipelines run \
    --id 9 \
    --branch develop \
    --organization "https://dev.azure.com/citadelcloudmanagement" \
    --project "ApplyPlatform"
```

### Option 3: Azure VM Scale Set Agents (Production Grade)
For production workloads, use Azure Virtual Machine Scale Set agents:

```bash
# Create a VMSS for DevOps agents
az vmss create \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "devops-agent-vmss" \
    --image "Canonical:0001-com-ubuntu-server-jammy:22_04-lts:latest" \
    --vm-sku "Standard_D2s_v3" \
    --instance-count 0 \
    --admin-username azureuser \
    --generate-ssh-keys

# Configure the scale set in Azure DevOps
# Go to: Project Settings > Agent Pools > Add Pool > Azure Virtual Machine Scale Set
```

## Pipeline Configuration

The pipeline (`azure-pipelines-terraform.yml`) has been updated to use the self-hosted agent pool:

```yaml
# Current configuration (self-hosted)
pool:
  name: 'Default'

# To switch back to Microsoft-hosted (after parallelism grant):
pool:
  vmImage: 'ubuntu-latest'
```

## Agent Management

### View Container Logs
```bash
az container logs \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "terraform-agent-1"
```

### Stop Agent
```bash
az container stop \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "terraform-agent-1"
```

### Delete Agent
```bash
az container delete \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "terraform-agent-1" \
    --yes
```

### Restart Agent
```bash
az container restart \
    --resource-group "applyplatform-devops-agent-rg" \
    --name "terraform-agent-1"
```

## Cost Considerations

| Agent Type | Cost | Wait Time |
|------------|------|-----------|
| Microsoft-Hosted (Free Tier) | Free (1800 min/month) | 2-3 days |
| Container Instance (B2s) | ~$30/month | Immediate |
| VM Scale Set (D2s_v3) | ~$70/month | Immediate |

## Troubleshooting

### Agent Not Appearing in Pool
1. Check container logs for errors
2. Verify PAT token has correct scopes
3. Ensure AZP_URL and AZP_POOL are correct

### Pipeline Still Fails
1. Verify agent is "Online" in the pool
2. Check agent capabilities match pipeline requirements
3. Review pipeline YAML for syntax errors

### Container Keeps Restarting
1. Check PAT token hasn't expired
2. Verify network connectivity to Azure DevOps
3. Review container logs for authentication errors
