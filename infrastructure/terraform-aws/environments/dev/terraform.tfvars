# Development Environment Configuration
# Cost-Optimized: Spot instances, auto-shutdown, single NAT

environment = "dev"
aws_region  = "us-east-1"
dr_region   = "us-west-2"

# Cost Allocation Tags
owner       = "platform-team@applyforus.com"
cost_center = "PLATFORM-DEV"

# Auto-shutdown enabled for dev
auto_shutdown = "true"

# Networking - Single NAT for cost savings
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
enable_nat_gateway = true
single_nat_gateway = true # COST: ~$32/month vs $96/month for HA

# EKS Configuration
eks_cluster_version = "1.30"

# COST OPTIMIZATION: All Spot, Graviton (ARM64), scale to zero
# RESOURCE EFFICIENCY: Keep nodes minimal until deployment needed
eks_node_groups = {
  system = {
    instance_types = ["t4g.medium"] # Graviton, cheapest viable
    capacity_type  = "ON_DEMAND"    # System nodes need stability
    ami_type       = "AL2023_ARM_64_STANDARD" # ARM64 AMI for Graviton
    min_size       = 1
    max_size       = 2
    desired_size   = 1 # Minimal for dev - scale up only when needed
    disk_size      = 30
    labels         = { "node-type" = "system" }
    taints         = []
  }
  application = {
    instance_types = ["t4g.medium", "t4g.large", "m6g.medium"]
    capacity_type  = "SPOT"                   # 70% cost savings
    ami_type       = "AL2023_ARM_64_STANDARD" # ARM64 AMI for Graviton
    min_size       = 0                        # Scale to zero when not in use
    max_size       = 5
    desired_size   = 0 # Start at zero - Karpenter provisions as needed
    disk_size      = 50
    labels         = { "node-type" = "application" }
    taints         = []
  }
}

enable_karpenter          = true
enable_container_insights = false # Cost savings for dev

# ECR
ecr_repositories = [
  "applyai-web",
  "applyai-auth-service",
  "applyai-user-service",
  "applyai-job-service",
  "applyai-resume-service",
  "applyai-notification-service",
  "applyai-auto-apply-service",
  "applyai-analytics-service",
  "applyai-ai-service",
  "applyai-orchestrator-service",
  "applyai-payment-service"
]
ecr_image_retention_count = 10 # Keep fewer images in dev

# Cost Management
monthly_budget_limit = 500
budget_alert_emails  = ["platform-team@applyforus.com"]

# Auto-shutdown schedules (UTC)
shutdown_schedule = "cron(0 19 ? * MON-FRI *)" # 7 PM weekdays
startup_schedule  = "cron(0 7 ? * MON-FRI *)"  # 7 AM weekdays

# Monitoring
cloudwatch_log_retention_days = 7 # Short retention for dev

# CI/CD Configuration
github_repository    = "oks-citadel/Apply"
github_branch        = "develop" # Use develop branch for dev
codebuild_timeout    = 45
kubernetes_namespace = "applyforus-dev"
