# AWS ECR Module - Container Registry
# Migrated from Azure Container Registry

#-------------------------------------------------------------------------------
# ECR Repositories
#-------------------------------------------------------------------------------

resource "aws_ecr_repository" "main" {
  for_each = toset(var.repositories)

  name                 = each.value
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = each.value
  }
}

#-------------------------------------------------------------------------------
# Lifecycle Policies (Cost Optimization)
#-------------------------------------------------------------------------------

resource "aws_ecr_lifecycle_policy" "main" {
  for_each = toset(var.repositories)

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.image_retention_count} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = var.image_retention_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than ${var.untagged_image_expiry_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_expiry_days
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Delete dev/feature images older than ${var.dev_image_expiry_days} days"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["dev-", "feature-", "pr-"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = var.dev_image_expiry_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

#-------------------------------------------------------------------------------
# Repository Policies
#-------------------------------------------------------------------------------

resource "aws_ecr_repository_policy" "main" {
  for_each = var.enable_cross_account_access ? toset(var.repositories) : toset([])

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossAccountPull"
        Effect = "Allow"
        Principal = {
          AWS = var.cross_account_arns
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

#-------------------------------------------------------------------------------
# Replication Configuration (Prod Only)
#-------------------------------------------------------------------------------

resource "aws_ecr_replication_configuration" "main" {
  count = var.enable_replication ? 1 : 0

  replication_configuration {
    rule {
      destination {
        region      = var.replication_region
        registry_id = var.replication_registry_id != "" ? var.replication_registry_id : data.aws_caller_identity.current.account_id
      }

      repository_filter {
        filter      = "applyai-"
        filter_type = "PREFIX_MATCH"
      }
    }
  }
}

data "aws_caller_identity" "current" {}

#-------------------------------------------------------------------------------
# Pull-Through Cache (Optional - for public images)
#-------------------------------------------------------------------------------

resource "aws_ecr_pull_through_cache_rule" "docker_hub" {
  count = var.enable_pull_through_cache ? 1 : 0

  ecr_repository_prefix = "docker-hub"
  upstream_registry_url = "registry-1.docker.io"
}

resource "aws_ecr_pull_through_cache_rule" "ghcr" {
  count = var.enable_pull_through_cache ? 1 : 0

  ecr_repository_prefix = "ghcr"
  upstream_registry_url = "ghcr.io"
}
