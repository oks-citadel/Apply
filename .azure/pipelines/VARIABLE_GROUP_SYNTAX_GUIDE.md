# Azure DevOps Variable Group Syntax Guide

## Common Syntax Error

### INCORRECT Syntax (DO NOT USE)
```yaml
# This syntax is WRONG and will NOT work in Azure DevOps
variables:
  ARM_SUBSCRIPTION_ID: $[ variablegroups.terraform-credentials.ARM_SUBSCRIPTION_ID ]
  SQL_ADMIN_USERNAME: $[ variablegroups.terraform-credentials.SQL_ADMIN_USERNAME ]
  AZURE_SERVICE_CONNECTION: $[ variablegroups.terraform-credentials.AZURE_SERVICE_CONNECTION ]
```

The syntax `$[ variablegroups.name.variable ]` does NOT exist in Azure DevOps and will cause pipeline failures.

---

## CORRECT Syntax

### Method 1: Link Variable Group + Reference Variables

This is the recommended approach used in Azure DevOps:

```yaml
# Step 1: Link the variable group at the pipeline level
variables:
  - group: terraform-credentials  # Link the entire group
  - group: applyforus-common       # Can link multiple groups

# Step 2: Reference variables using $(variableName) syntax
stages:
  - stage: Deploy
    jobs:
      - job: DeployInfrastructure
        steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: $(AZURE_SERVICE_CONNECTION)
              scriptType: bash
              inlineScript: |
                echo "Subscription ID: $(ARM_SUBSCRIPTION_ID)"
                echo "SQL Admin Username: $(SQL_ADMIN_USERNAME)"

                # Variables can be used directly in scripts
                export ARM_SUBSCRIPTION_ID=$(ARM_SUBSCRIPTION_ID)
                export SQL_ADMIN_USERNAME=$(SQL_ADMIN_USERNAME)
```

### Method 2: Environment-Specific Variable Groups

```yaml
variables:
  - group: terraform-credentials
  - group: applyforus-${{ parameters.environment }}  # Dynamic group selection

parameters:
  - name: environment
    type: string
    default: 'dev'
    values:
      - dev
      - test
      - prod

stages:
  - stage: TerraformApply
    jobs:
      - job: Apply
        steps:
          - script: |
              echo "Using credentials from terraform-credentials group"
              echo "Deploying to $(environment) environment"
```

---

## Complete Working Example

Here's a complete example of a pipeline using variable groups correctly:

```yaml
# azure-pipelines-terraform-example.yml
trigger:
  branches:
    include:
      - main
      - develop

variables:
  # Link variable groups (Step 1)
  - group: terraform-credentials
  - group: applyforus-common
  - group: applyforus-terraform

  # You can also define inline variables
  - name: terraformVersion
    value: 'latest'
  - name: workingDirectory
    value: '$(System.DefaultWorkingDirectory)/infrastructure/terraform'

stages:
  - stage: TerraformPlan
    displayName: 'Terraform Plan'
    jobs:
      - job: Plan
        displayName: 'Plan Infrastructure Changes'
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - checkout: self

          # Using variables from the linked groups (Step 2)
          - task: AzureCLI@2
            displayName: 'Setup Terraform'
            inputs:
              azureSubscription: $(AZURE_SERVICE_CONNECTION)  # From terraform-credentials group
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                echo "Setting up Terraform with ARM credentials"

                # Export variables from variable groups
                export ARM_SUBSCRIPTION_ID=$(ARM_SUBSCRIPTION_ID)
                export ARM_TENANT_ID=$(ARM_TENANT_ID)
                export ARM_CLIENT_ID=$(ARM_CLIENT_ID)
                export ARM_CLIENT_SECRET=$(ARM_CLIENT_SECRET)

                echo "Subscription: $(ARM_SUBSCRIPTION_ID)"
                echo "Using SQL Admin: $(SQL_ADMIN_USERNAME)"

                # Initialize Terraform
                terraform init \
                  -backend-config="resource_group_name=$(backendResourceGroup)" \
                  -backend-config="storage_account_name=$(backendStorageAccount)" \
                  -backend-config="container_name=$(backendContainerName)"

          - task: TerraformTaskV4@4
            displayName: 'Terraform Plan'
            inputs:
              provider: 'azurerm'
              command: 'plan'
              workingDirectory: '$(workingDirectory)'
              environmentServiceNameAzureRM: '$(AZURE_SERVICE_CONNECTION)'
              commandOptions: |
                -var="subscription_id=$(ARM_SUBSCRIPTION_ID)"
                -var="sql_admin_username=$(SQL_ADMIN_USERNAME)"
                -out=tfplan
```

---

## Variable Group Setup in Azure DevOps

### Creating the terraform-credentials Variable Group

1. Navigate to **Pipelines** > **Library** in Azure DevOps
2. Click **+ Variable group**
3. Name: `terraform-credentials`
4. Add these variables:

| Variable Name | Type | Value |
|--------------|------|-------|
| `ARM_SUBSCRIPTION_ID` | Secret | Your Azure subscription ID |
| `ARM_TENANT_ID` | Secret | Your Azure tenant ID |
| `ARM_CLIENT_ID` | Secret | Service principal app ID |
| `ARM_CLIENT_SECRET` | Secret | Service principal secret |
| `SQL_ADMIN_USERNAME` | Secret | SQL administrator username |
| `SQL_ADMIN_PASSWORD` | Secret | SQL administrator password |
| `AZURE_SERVICE_CONNECTION` | Plain | Name of your Azure service connection |

5. Click **Save**
6. Go to **Pipeline permissions** tab
7. Grant access to your pipelines

---

## Different Variable Syntax in Azure DevOps

Azure DevOps supports multiple variable syntaxes for different purposes:

### 1. Macro Syntax: `$(variableName)`
```yaml
# Used in most places - variables, task inputs, scripts
steps:
  - script: echo "Value is $(myVariable)"
  - task: SomeTask@1
    inputs:
      inputField: $(myVariable)
```

### 2. Template Expression: `${{ variables.variableName }}`
```yaml
# Used at compile time, before runtime variables are available
parameters:
  - name: environment
    default: dev

variables:
  resourceGroup: applyforus-${{ parameters.environment }}-rg
```

### 3. Runtime Expression: `$[variables.variableName]`
```yaml
# Used for conditions and dynamic variable values
variables:
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  patchVersion: $[counter(format('{0}.{1}', variables['majorVersion'], variables['minorVersion']), 0)]
```

**IMPORTANT:** There is NO `$[ variablegroups.name.variable ]` syntax in Azure DevOps!

---

## Troubleshooting Variable Issues

### Issue: Variable not resolving

**Wrong:**
```yaml
- script: echo $[ variablegroups.terraform-credentials.ARM_SUBSCRIPTION_ID ]
```

**Correct:**
```yaml
variables:
  - group: terraform-credentials

steps:
  - script: echo $(ARM_SUBSCRIPTION_ID)
```

### Issue: Variable empty in script

Secret variables need to be explicitly mapped to the environment:

**Wrong:**
```yaml
- script: |
    echo $ARM_SUBSCRIPTION_ID  # Empty!
```

**Correct:**
```yaml
- script: |
    echo $(ARM_SUBSCRIPTION_ID)
    # OR
    echo $ARM_SUB_ID
  env:
    ARM_SUB_ID: $(ARM_SUBSCRIPTION_ID)  # Map to environment variable
```

### Issue: Variable not available across stages

Variables from variable groups are available in all stages by default, but you need to link the group at the appropriate level:

**Wrong:**
```yaml
stages:
  - stage: Build
    variables:
      - group: my-variables

  - stage: Deploy  # Variables not available here!
    jobs:
      - job: Deploy
        steps:
          - script: echo $(myVariable)  # Empty!
```

**Correct:**
```yaml
# Link at pipeline level for all stages
variables:
  - group: my-variables

stages:
  - stage: Build
    # Variable available here

  - stage: Deploy
    # Variable available here too
```

---

## Best Practices

1. **Always link variable groups at the pipeline level** unless you have specific stage/job requirements

2. **Use descriptive variable names** that indicate their purpose
   - Good: `ARM_SUBSCRIPTION_ID`, `SQL_ADMIN_USERNAME`
   - Bad: `VAR1`, `SECRET1`

3. **Mark sensitive values as secret** in Azure DevOps to prevent logging

4. **Use separate variable groups per environment**
   ```yaml
   variables:
     - group: common-variables
     - group: ${{ parameters.environment }}-variables
   ```

5. **Document your variable groups** in your repository (like we do in `variable_groups.md`)

6. **Test variable resolution** with a simple echo statement before using in complex tasks

---

## Migration Guide

If you have pipelines using the incorrect syntax, here's how to fix them:

### Before (INCORRECT):
```yaml
variables:
  ARM_SUBSCRIPTION_ID: $[ variablegroups.terraform-credentials.ARM_SUBSCRIPTION_ID ]
  SQL_ADMIN_USERNAME: $[ variablegroups.terraform-credentials.SQL_ADMIN_USERNAME ]
  AZURE_SERVICE_CONNECTION: $[ variablegroups.terraform-credentials.AZURE_SERVICE_CONNECTION ]

stages:
  - stage: Deploy
    jobs:
      - job: DeployJob
        steps:
          - script: echo "Using subscription: $(ARM_SUBSCRIPTION_ID)"
```

### After (CORRECT):
```yaml
variables:
  - group: terraform-credentials  # Link the variable group

stages:
  - stage: Deploy
    jobs:
      - job: DeployJob
        steps:
          - script: |
              echo "Using subscription: $(ARM_SUBSCRIPTION_ID)"
              echo "SQL Admin: $(SQL_ADMIN_USERNAME)"
              echo "Service Connection: $(AZURE_SERVICE_CONNECTION)"
```

---

## Quick Reference

| What You Want | Correct Syntax |
|--------------|----------------|
| Link variable group | `variables:`<br>`  - group: group-name` |
| Reference variable | `$(variableName)` |
| Use in script | `echo $(variableName)` |
| Pass to task | `input: $(variableName)` |
| Environment variable | `env:`<br>`  VAR: $(variableName)` |
| Conditional | `$[eq(variables['var'], 'value')]` |
| Template param | `${{ variables.variableName }}` |

---

## Additional Resources

- [Azure DevOps Variable Groups Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)
- [Azure DevOps Variables Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables)
- [Variable Syntax Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables#understand-variable-syntax)

---

## Summary

Remember: The syntax `$[ variablegroups.name.variable ]` does NOT exist!

Always use:
1. Link group: `- group: group-name`
2. Reference variable: `$(variableName)`
