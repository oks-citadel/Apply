# Staging Environment Configuration
# Moderate cost optimization: Mixed Spot/On-Demand, scheduled scaling

environment = "staging"
aws_region  = "us-east-1"
dr_region   = "us-west-2"

# Cost Allocation Tags
owner       = "platform-team@applyforus.com"
cost_center = "PLATFORM-STAGING"

# Scheduled shutdown for staging
auto_shutdown = "true"

# Networking - Single NAT for cost savings
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
enable_nat_gateway = true
single_nat_gateway = true # COST: ~$32/month vs $96/month for HA

# EKS Configuration
eks_cluster_version = "1.30"

# Mixed Spot/On-Demand for better reliability
eks_node_groups = {
  system = {
    instance_types = ["m6g.medium", "m6g.large"] # Graviton
    capacity_type  = "ON_DEMAND"
    min_size       = 1
    max_size       = 3
    desired_size   = 2
    disk_size      = 50
    labels         = { "node-type" = "system" }
    taints         = []
  }
  application = {
    instance_types = ["m6g.large", "m6g.xlarge", "m7g.large"]
    capacity_type  = "SPOT" # 70% cost savings
    min_size       = 1      # Keep 1 for faster startup
    max_size       = 8
    desired_size   = 2
    disk_size      = 100
    labels         = { "node-type" = "application" }
    taints         = []
  }
}

enable_karpenter          = true
enable_container_insights = true

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
ecr_image_retention_count = 20

# Cost Management
monthly_budget_limit = 1000
budget_alert_emails  = ["platform-team@applyforus.com"]

# Scheduled scaling (nights/weekends)
shutdown_schedule = "cron(0 22 ? * MON-FRI *)" # 10 PM weekdays
startup_schedule  = "cron(0 5 ? * MON-FRI *)"  # 5 AM weekdays

# Monitoring
cloudwatch_log_retention_days = 14
