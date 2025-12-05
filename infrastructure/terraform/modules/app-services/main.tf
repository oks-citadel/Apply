# App Services Module
# Creates all microservices for the JobPilot AI Platform

locals {
  # Common app settings for all services
  common_app_settings = {
    ENVIRONMENT                      = var.environment
    APPINSIGHTS_INSTRUMENTATIONKEY   = var.app_insights_key
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.app_insights_connection_string
    DOCKER_REGISTRY_SERVER_URL       = var.container_registry_url
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITES_PORT                    = "8080"
  }

  # Service-specific configurations
  services = {
    web-app = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/health"
      cors_origins = ["*"]
      app_settings = {}
    }
    auth-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        JWT_SECRET                = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=jwt-secret)"
        JWT_EXPIRATION            = "24h"
        REFRESH_TOKEN_EXPIRATION  = "7d"
      }
    }
    user-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        DATABASE_URL = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=database-url)"
      }
    }
    job-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        DATABASE_URL = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=database-url)"
        OPENAI_API_KEY = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=openai-api-key)"
      }
    }
    resume-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        DATABASE_URL = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=database-url)"
        STORAGE_ACCOUNT_NAME = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=storage-account-name)"
        STORAGE_ACCOUNT_KEY = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=storage-account-key)"
      }
    }
    analytics-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        DATABASE_URL = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=database-url)"
      }
    }
    auto-apply-service = {
      stack_type = "node"
      stack_version = "20-lts"
      health_check = "/api/health"
      cors_origins = ["*"]
      app_settings = {
        DATABASE_URL = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=database-url)"
        OPENAI_API_KEY = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=openai-api-key)"
      }
    }
    ai-service = {
      stack_type = "python"
      stack_version = "3.11"
      health_check = "/health"
      cors_origins = ["*"]
      app_settings = {
        OPENAI_API_KEY = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=openai-api-key)"
        AZURE_OPENAI_ENDPOINT = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=azure-openai-endpoint)"
        AZURE_OPENAI_API_KEY = "@Microsoft.KeyVault(VaultName=${var.key_vault_name};SecretName=azure-openai-api-key)"
      }
    }
  }
}

# Web App - Frontend Application
resource "azurerm_linux_web_app" "web_app" {
  name                = "${var.project_name}-web-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["web-app"].stack_version
    }

    health_check_path = local.services["web-app"].health_check

    cors {
      allowed_origins = local.services["web-app"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["web-app"].app_settings,
    {
      SERVICE_NAME = "web-app"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
      API_BASE_URL = "https://${var.project_name}-auth-${var.environment}.azurewebsites.net"
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Frontend"
      Service   = "web-app"
      ManagedBy = "Terraform"
    }
  )
}

# Auth Service
resource "azurerm_linux_web_app" "auth_service" {
  name                = "${var.project_name}-auth-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["auth-service"].stack_version
    }

    health_check_path = local.services["auth-service"].health_check

    cors {
      allowed_origins = local.services["auth-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["auth-service"].app_settings,
    {
      SERVICE_NAME = "auth-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "auth-service"
      ManagedBy = "Terraform"
    }
  )
}

# User Service
resource "azurerm_linux_web_app" "user_service" {
  name                = "${var.project_name}-user-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["user-service"].stack_version
    }

    health_check_path = local.services["user-service"].health_check

    cors {
      allowed_origins = local.services["user-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["user-service"].app_settings,
    {
      SERVICE_NAME = "user-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "user-service"
      ManagedBy = "Terraform"
    }
  )
}

# Job Service
resource "azurerm_linux_web_app" "job_service" {
  name                = "${var.project_name}-job-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["job-service"].stack_version
    }

    health_check_path = local.services["job-service"].health_check

    cors {
      allowed_origins = local.services["job-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["job-service"].app_settings,
    {
      SERVICE_NAME = "job-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "job-service"
      ManagedBy = "Terraform"
    }
  )
}

# Resume Service
resource "azurerm_linux_web_app" "resume_service" {
  name                = "${var.project_name}-resume-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["resume-service"].stack_version
    }

    health_check_path = local.services["resume-service"].health_check

    cors {
      allowed_origins = local.services["resume-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["resume-service"].app_settings,
    {
      SERVICE_NAME = "resume-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "resume-service"
      ManagedBy = "Terraform"
    }
  )
}

# Analytics Service
resource "azurerm_linux_web_app" "analytics_service" {
  name                = "${var.project_name}-analytics-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["analytics-service"].stack_version
    }

    health_check_path = local.services["analytics-service"].health_check

    cors {
      allowed_origins = local.services["analytics-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["analytics-service"].app_settings,
    {
      SERVICE_NAME = "analytics-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "analytics-service"
      ManagedBy = "Terraform"
    }
  )
}

# Auto Apply Service
resource "azurerm_linux_web_app" "auto_apply_service" {
  name                = "${var.project_name}-autoapply-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      node_version = local.services["auto-apply-service"].stack_version
    }

    health_check_path = local.services["auto-apply-service"].health_check

    cors {
      allowed_origins = local.services["auto-apply-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["auto-apply-service"].app_settings,
    {
      SERVICE_NAME = "auto-apply-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "auto-apply-service"
      ManagedBy = "Terraform"
    }
  )
}

# AI Service (Python-based)
resource "azurerm_linux_web_app" "ai_service" {
  name                = "${var.project_name}-ai-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = var.app_service_plan_id

  site_config {
    always_on = var.environment == "prod" ? true : false

    application_stack {
      python_version = local.services["ai-service"].stack_version
    }

    health_check_path = local.services["ai-service"].health_check

    cors {
      allowed_origins = local.services["ai-service"].cors_origins
      support_credentials = true
    }

    ftps_state = "FtpsOnly"
    http2_enabled = true
    minimum_tls_version = "1.2"
  }

  app_settings = merge(
    local.common_app_settings,
    local.services["ai-service"].app_settings,
    {
      SERVICE_NAME = "ai-service"
      DOCKER_REGISTRY_SERVER_USERNAME = var.container_registry_name
      PYTHONUNBUFFERED = "1"
    }
  )

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = var.subnet_id

  https_only = true

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Backend"
      Service   = "ai-service"
      ManagedBy = "Terraform"
    }
  )
}
