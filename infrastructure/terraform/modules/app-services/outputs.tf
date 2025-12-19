# App Services Module Outputs

# Individual service IDs
output "app_service_ids" {
  description = "Map of all App Service IDs"
  value = {
    web-app            = azurerm_linux_web_app.web_app.id
    auth-service       = azurerm_linux_web_app.auth_service.id
    user-service       = azurerm_linux_web_app.user_service.id
    job-service        = azurerm_linux_web_app.job_service.id
    resume-service     = azurerm_linux_web_app.resume_service.id
    analytics-service  = azurerm_linux_web_app.analytics_service.id
    auto-apply-service = azurerm_linux_web_app.auto_apply_service.id
    ai-service         = azurerm_linux_web_app.ai_service.id
  }
}

# Primary service URLs
output "web_app_url" {
  description = "URL of the web application"
  value       = "https://${azurerm_linux_web_app.web_app.default_hostname}"
}

output "auth_service_url" {
  description = "URL of the authentication service"
  value       = "https://${azurerm_linux_web_app.auth_service.default_hostname}"
}

output "ai_service_url" {
  description = "URL of the AI service"
  value       = "https://${azurerm_linux_web_app.ai_service.default_hostname}"
}

# All service URLs
output "all_service_urls" {
  description = "Map of all service URLs"
  value = {
    web-app            = "https://${azurerm_linux_web_app.web_app.default_hostname}"
    auth-service       = "https://${azurerm_linux_web_app.auth_service.default_hostname}"
    user-service       = "https://${azurerm_linux_web_app.user_service.default_hostname}"
    job-service        = "https://${azurerm_linux_web_app.job_service.default_hostname}"
    resume-service     = "https://${azurerm_linux_web_app.resume_service.default_hostname}"
    analytics-service  = "https://${azurerm_linux_web_app.analytics_service.default_hostname}"
    auto-apply-service = "https://${azurerm_linux_web_app.auto_apply_service.default_hostname}"
    ai-service         = "https://${azurerm_linux_web_app.ai_service.default_hostname}"
  }
}

# Service identities for Key Vault access policies
output "service_identities" {
  description = "Map of service principal IDs for managed identities"
  value = {
    web-app            = azurerm_linux_web_app.web_app.identity[0].principal_id
    auth-service       = azurerm_linux_web_app.auth_service.identity[0].principal_id
    user-service       = azurerm_linux_web_app.user_service.identity[0].principal_id
    job-service        = azurerm_linux_web_app.job_service.identity[0].principal_id
    resume-service     = azurerm_linux_web_app.resume_service.identity[0].principal_id
    analytics-service  = azurerm_linux_web_app.analytics_service.identity[0].principal_id
    auto-apply-service = azurerm_linux_web_app.auto_apply_service.identity[0].principal_id
    ai-service         = azurerm_linux_web_app.ai_service.identity[0].principal_id
  }
}
