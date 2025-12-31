# AWS Provider Configuration for ApplyForUs Platform
# Migrated from Azure to AWS - Organization: o-14wy6xb785

provider "aws" {
  region = var.aws_region

  # Assume role for cross-account access
  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn     = var.assume_role_arn
      session_name = "TerraformApplyForUs"
    }
  }

  # Mandatory cost allocation tags applied to ALL resources
  default_tags {
    tags = {
      Environment    = var.environment
      Owner          = var.owner
      CostCenter     = var.cost_center
      Application    = "ApplyForUs"
      ManagedBy      = "terraform"
      Project        = "job-apply-platform"
      AutoShutdown   = var.auto_shutdown
      ExpirationDate = var.expiration_date
    }
  }
}

# Secondary region for disaster recovery (prod only)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  dynamic "assume_role" {
    for_each = var.assume_role_arn != "" ? [1] : []
    content {
      role_arn     = var.assume_role_arn
      session_name = "TerraformApplyForUsDR"
    }
  }

  default_tags {
    tags = {
      Environment    = var.environment
      Owner          = var.owner
      CostCenter     = var.cost_center
      Application    = "ApplyForUs"
      ManagedBy      = "terraform"
      Project        = "job-apply-platform"
      AutoShutdown   = var.auto_shutdown
      ExpirationDate = var.expiration_date
    }
  }
}

# Kubernetes provider (configured after EKS cluster creation)
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# Helm provider for Kubernetes package management
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}
