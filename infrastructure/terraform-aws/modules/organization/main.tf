# AWS Organization and Service Control Policies
# Organization ID: o-14wy6xb785

#-------------------------------------------------------------------------------
# Organization Structure Validation
#-------------------------------------------------------------------------------

data "aws_organizations_organization" "current" {}

# Validate organization ID
locals {
  expected_org_id = "o-14wy6xb785"
  org_validation  = data.aws_organizations_organization.current.id == local.expected_org_id ? true : tobool("ERROR: Organization ID mismatch. Expected ${local.expected_org_id}, got ${data.aws_organizations_organization.current.id}")
}

#-------------------------------------------------------------------------------
# Organizational Units
#-------------------------------------------------------------------------------

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_organizational_unit" "shared_services" {
  name      = "Shared-Services"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = data.aws_organizations_organization.current.roots[0].id
}

resource "aws_organizations_organizational_unit" "workloads_dev" {
  name      = "Dev"
  parent_id = aws_organizations_organizational_unit.workloads.id
}

resource "aws_organizations_organizational_unit" "workloads_staging" {
  name      = "Staging"
  parent_id = aws_organizations_organizational_unit.workloads.id
}

resource "aws_organizations_organizational_unit" "workloads_prod" {
  name      = "Prod"
  parent_id = aws_organizations_organizational_unit.workloads.id
}

#-------------------------------------------------------------------------------
# Service Control Policies
#-------------------------------------------------------------------------------

# SCP 1: Deny Root User Actions
resource "aws_organizations_policy" "deny_root_usage" {
  name        = "DenyRootUsage"
  description = "Deny all actions by root user"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyRootUser"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:PrincipalArn" = "arn:aws:iam::*:root"
          }
        }
      }
    ]
  })
}

# SCP 2: Deny Organizations Changes
resource "aws_organizations_policy" "deny_organizations_changes" {
  name        = "DenyOrganizationsChanges"
  description = "Prevent modifications to AWS Organizations"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyOrganizationsAccess"
        Effect   = "Deny"
        Action   = "organizations:*"
        Resource = "*"
      }
    ]
  })
}

# SCP 3: Protect Audit Logs
resource "aws_organizations_policy" "protect_audit_logs" {
  name        = "ProtectAuditLogs"
  description = "Prevent tampering with audit logs"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAuditTampering"
        Effect = "Deny"
        Action = [
          "cloudtrail:DeleteTrail",
          "cloudtrail:StopLogging",
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream",
          "s3:DeleteBucket",
          "s3:DeleteObject"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "aws:ResourceTag/Purpose" = ["audit", "security", "compliance"]
          }
        }
      }
    ]
  })
}

# SCP 4: Protect Production Deletes
resource "aws_organizations_policy" "protect_production_deletes" {
  name        = "ProtectProductionDeletes"
  description = "Prevent accidental deletion of production resources"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyCriticalDeletesInProd"
        Effect = "Deny"
        Action = [
          "ec2:TerminateInstances",
          "eks:DeleteCluster",
          "eks:DeleteNodegroup",
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "s3:DeleteBucket",
          "elasticloadbalancing:DeleteLoadBalancer",
          "elasticache:DeleteCacheCluster",
          "es:DeleteDomain"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = "prod"
          }
        }
      }
    ]
  })
}

# SCP 5: Deny Expensive Services in Non-Production
resource "aws_organizations_policy" "deny_expensive_services" {
  name        = "DenyExpensiveServicesInNonProd"
  description = "Block expensive services and instance types in dev/staging"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyExpensiveServicesInNonProd"
        Effect = "Deny"
        Action = [
          "redshift:CreateCluster",
          "opensearch:CreateDomain",
          "sagemaker:CreateNotebookInstance",
          "sagemaker:CreateTrainingJob"
        ]
        Resource = "*"
      },
      {
        Sid      = "DenyLargeInstanceTypes"
        Effect   = "Deny"
        Action   = "ec2:RunInstances"
        Resource = "arn:aws:ec2:*:*:instance/*"
        Condition = {
          StringLike = {
            "ec2:InstanceType" = [
              "*.metal",
              "*.24xlarge",
              "*.16xlarge",
              "*.12xlarge",
              "p*.*",
              "inf*.*",
              "trn*.*"
            ]
          }
        }
      }
    ]
  })
}

# SCP 6: Enforce Region Restriction
resource "aws_organizations_policy" "enforce_region_restriction" {
  name        = "EnforceRegionRestriction"
  description = "Restrict operations to approved regions only"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "DenyNonApprovedRegions"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
          # Allow global services
          "ForAnyValue:StringNotLike" = {
            "aws:PrincipalArn" = [
              "arn:aws:iam::*:role/aws-service-role/*"
            ]
          }
        }
      }
    ]
  })
}

# SCP 7: Enforce Mandatory Tagging
resource "aws_organizations_policy" "enforce_tagging" {
  name        = "EnforceMandatoryTagging"
  description = "Require mandatory cost allocation tags"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUntaggedResources"
        Effect = "Deny"
        Action = [
          "ec2:RunInstances",
          "rds:CreateDBInstance",
          "rds:CreateDBCluster",
          "eks:CreateCluster",
          "elasticloadbalancing:CreateLoadBalancer",
          "elasticache:CreateCacheCluster",
          "es:CreateDomain"
        ]
        Resource = "*"
        Condition = {
          Null = {
            "aws:RequestTag/Environment" = "true"
            "aws:RequestTag/Owner"       = "true"
            "aws:RequestTag/CostCenter"  = "true"
          }
        }
      }
    ]
  })
}

#-------------------------------------------------------------------------------
# SCP Attachments
#-------------------------------------------------------------------------------

# Attach DenyRootUsage to all OUs
resource "aws_organizations_policy_attachment" "deny_root_all" {
  policy_id = aws_organizations_policy.deny_root_usage.id
  target_id = data.aws_organizations_organization.current.roots[0].id
}

# Attach DenyOrganizationsChanges to all workload OUs
resource "aws_organizations_policy_attachment" "deny_org_changes_security" {
  policy_id = aws_organizations_policy.deny_organizations_changes.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "deny_org_changes_shared" {
  policy_id = aws_organizations_policy.deny_organizations_changes.id
  target_id = aws_organizations_organizational_unit.shared_services.id
}

resource "aws_organizations_policy_attachment" "deny_org_changes_workloads" {
  policy_id = aws_organizations_policy.deny_organizations_changes.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

# Attach ProtectAuditLogs to Security and Workloads
resource "aws_organizations_policy_attachment" "protect_audit_security" {
  policy_id = aws_organizations_policy.protect_audit_logs.id
  target_id = aws_organizations_organizational_unit.security.id
}

resource "aws_organizations_policy_attachment" "protect_audit_workloads" {
  policy_id = aws_organizations_policy.protect_audit_logs.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

# Attach ProtectProductionDeletes to Prod OU only
resource "aws_organizations_policy_attachment" "protect_prod_deletes" {
  policy_id = aws_organizations_policy.protect_production_deletes.id
  target_id = aws_organizations_organizational_unit.workloads_prod.id
}

# Attach DenyExpensiveServices to Dev and Staging OUs
resource "aws_organizations_policy_attachment" "deny_expensive_dev" {
  policy_id = aws_organizations_policy.deny_expensive_services.id
  target_id = aws_organizations_organizational_unit.workloads_dev.id
}

resource "aws_organizations_policy_attachment" "deny_expensive_staging" {
  policy_id = aws_organizations_policy.deny_expensive_services.id
  target_id = aws_organizations_organizational_unit.workloads_staging.id
}

# Attach EnforceRegionRestriction to all OUs
resource "aws_organizations_policy_attachment" "region_restriction" {
  policy_id = aws_organizations_policy.enforce_region_restriction.id
  target_id = data.aws_organizations_organization.current.roots[0].id
}

# Attach EnforceTagging to Workloads OU
resource "aws_organizations_policy_attachment" "enforce_tagging_workloads" {
  policy_id = aws_organizations_policy.enforce_tagging.id
  target_id = aws_organizations_organizational_unit.workloads.id
}
