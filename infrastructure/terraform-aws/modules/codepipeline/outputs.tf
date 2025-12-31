# CodePipeline Module Outputs

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main.name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = aws_codepipeline.main.arn
}

output "artifact_bucket_name" {
  description = "Name of the artifact S3 bucket"
  value       = aws_s3_bucket.artifacts.bucket
}

output "artifact_bucket_arn" {
  description = "ARN of the artifact S3 bucket"
  value       = aws_s3_bucket.artifacts.arn
}

output "github_connection_arn" {
  description = "ARN of the GitHub CodeStar connection"
  value       = aws_codestarconnections_connection.github.arn
}

output "github_connection_status" {
  description = "Status of the GitHub connection (must be AVAILABLE)"
  value       = aws_codestarconnections_connection.github.connection_status
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.pipeline_notifications.arn
}

output "codepipeline_role_arn" {
  description = "ARN of the CodePipeline IAM role"
  value       = aws_iam_role.codepipeline.arn
}

output "webhook_url" {
  description = "URL for GitHub webhook (if enabled)"
  value       = var.use_webhook ? aws_codepipeline_webhook.github[0].url : null
  sensitive   = true
}
