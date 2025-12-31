# Production Environment Configuration
# Cost-optimized with Reserved Capacity: Savings Plans, HA, geo-redundancy

environment = "prod"
aws_region  = "us-east-1"
dr_region   = "us-west-2"

# Cost Allocation Tags
owner       = "platform-team@applyforus.com"
cost_center = "PLATFORM-PROD"

# No auto-shutdown for production
auto_shutdown = "false"

# Networking - HA NAT Gateways for production
vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
enable_nat_gateway = true
single_nat_gateway = false # HA for production

# EKS Configuration
eks_cluster_version = "1.30"

# Production: Mixed with Savings Plans recommended
eks_node_groups = {
  system = {
    instance_types = ["m6g.large", "m6g.xlarge"] # Graviton (20% cheaper)
    capacity_type  = "ON_DEMAND"                 # Apply Savings Plans
    min_size       = 2
    max_size       = 5
    desired_size   = 3
    disk_size      = 100
    labels         = { "node-type" = "system" }
    taints         = []
  }
  application = {
    instance_types = ["m6g.xlarge", "m6g.2xlarge", "m7g.xlarge"]
    capacity_type  = "SPOT" # Use Spot for stateless workers
    min_size       = 3
    max_size       = 15
    desired_size   = 5
    disk_size      = 100
    labels         = { "node-type" = "application" }
    taints         = []
  }
  # On-demand fallback for critical workloads
  critical = {
    instance_types = ["m6g.large", "m6g.xlarge"]
    capacity_type  = "ON_DEMAND" # Apply Savings Plans
    min_size       = 2
    max_size       = 6
    desired_size   = 2
    disk_size      = 100
    labels         = { "node-type" = "critical", "workload" = "stateful" }
    taints = [{
      key    = "workload"
      value  = "critical"
      effect = "NO_SCHEDULE"
    }]
  }
}

enable_karpenter          = true
enable_container_insights = true

# ECR with geo-replication
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
ecr_image_retention_count = 50

# Cost Management - Production budget
monthly_budget_limit = 5000
budget_alert_emails = [
  "platform-team@applyforus.com",
  "finance@applyforus.com"
]

# No auto-shutdown for prod
shutdown_schedule = ""
startup_schedule  = ""

# Monitoring - Longer retention for production
cloudwatch_log_retention_days = 90

# RESERVED CAPACITY RECOMMENDATIONS (Apply after 2 weeks of stable prod):
#
# Compute Savings Plans (1-year, No Upfront):
# - Commit to 70% of steady-state compute usage
# - Estimated savings: 30-40%
#
# RDS Reserved Instances (1-year, No Upfront):
# - Reserve production database capacity
# - Estimated savings: 30-40%
#
# ElastiCache Reserved Nodes (1-year):
# - Reserve production Redis capacity
# - Estimated savings: 30-40%
