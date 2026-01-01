# CodeBuild Module Outputs

output "build_project_name" {
  description = "Name of the build CodeBuild project"
  value       = aws_codebuild_project.build.name
}

output "build_project_arn" {
  description = "ARN of the build CodeBuild project"
  value       = aws_codebuild_project.build.arn
}

output "deploy_project_name" {
  description = "Name of the deploy CodeBuild project"
  value       = aws_codebuild_project.deploy.name
}

output "deploy_project_arn" {
  description = "ARN of the deploy CodeBuild project"
  value       = aws_codebuild_project.deploy.arn
}

output "codebuild_role_arn" {
  description = "ARN of the CodeBuild IAM role"
  value       = aws_iam_role.codebuild.arn
}

output "codebuild_security_group_id" {
  description = "ID of the CodeBuild security group"
  value       = var.enable_vpc_config ? aws_security_group.codebuild[0].id : null
}

output "build_log_group_name" {
  description = "Name of the build log group"
  value       = aws_cloudwatch_log_group.build.name
}

output "deploy_log_group_name" {
  description = "Name of the deploy log group"
  value       = aws_cloudwatch_log_group.deploy.name
}
