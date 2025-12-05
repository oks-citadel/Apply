# Service Bus Module
# Creates Azure Service Bus namespace with queues and topics

# Service Bus Namespace
resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.project_name}-sb-${var.environment}-${var.unique_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.sku

  # Premium features (only available on Premium SKU)
  capacity                      = var.sku == "Premium" ? 1 : null
  premium_messaging_partitions  = var.sku == "Premium" ? 1 : null
  zone_redundant               = var.sku == "Premium" && var.environment == "prod" ? true : false

  # Network and security settings
  local_auth_enabled           = false
  public_network_access_enabled = true
  minimum_tls_version          = "1.2"

  tags = merge(
    var.tags,
    {
      Component = "Messaging"
      ManagedBy = "Terraform"
    }
  )
}

# Queue: Job Applications
resource "azurerm_servicebus_queue" "job_applications" {
  name         = "job-applications"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Message handling
  max_size_in_megabytes              = var.sku == "Premium" ? 81920 : 5120
  default_message_ttl                = "P14D"  # 14 days
  lock_duration                      = "PT5M"  # 5 minutes
  max_delivery_count                 = 10
  enable_batched_operations          = true
  enable_express                     = var.sku == "Standard" ? true : false
  enable_partitioning                = var.sku == "Standard" ? true : false

  # Dead letter queue
  dead_lettering_on_message_expiration = true

  # Duplicate detection
  requires_duplicate_detection = true
  duplicate_detection_history_time_window = "PT10M"
}

# Queue: Resume Processing
resource "azurerm_servicebus_queue" "resume_processing" {
  name         = "resume-processing"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Message handling
  max_size_in_megabytes              = var.sku == "Premium" ? 81920 : 5120
  default_message_ttl                = "P7D"   # 7 days
  lock_duration                      = "PT10M" # 10 minutes (longer for processing)
  max_delivery_count                 = 5
  enable_batched_operations          = true
  enable_express                     = var.sku == "Standard" ? true : false
  enable_partitioning                = var.sku == "Standard" ? true : false

  # Dead letter queue
  dead_lettering_on_message_expiration = true

  # Duplicate detection
  requires_duplicate_detection = true
  duplicate_detection_history_time_window = "PT10M"
}

# Queue: Notifications
resource "azurerm_servicebus_queue" "notifications" {
  name         = "notifications"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Message handling
  max_size_in_megabytes              = var.sku == "Premium" ? 81920 : 2048
  default_message_ttl                = "P1D"   # 1 day
  lock_duration                      = "PT1M"  # 1 minute
  max_delivery_count                 = 10
  enable_batched_operations          = true
  enable_express                     = var.sku == "Standard" ? true : false
  enable_partitioning                = var.sku == "Standard" ? true : false

  # Dead letter queue
  dead_lettering_on_message_expiration = true

  # Duplicate detection
  requires_duplicate_detection = true
  duplicate_detection_history_time_window = "PT10M"
}

# Queue: Analytics Events
resource "azurerm_servicebus_queue" "analytics_events" {
  name         = "analytics-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Message handling
  max_size_in_megabytes              = var.sku == "Premium" ? 81920 : 5120
  default_message_ttl                = "P30D"  # 30 days
  lock_duration                      = "PT5M"  # 5 minutes
  max_delivery_count                 = 10
  enable_batched_operations          = true
  enable_express                     = var.sku == "Standard" ? true : false
  enable_partitioning                = var.sku == "Standard" ? true : false

  # Dead letter queue
  dead_lettering_on_message_expiration = true

  # Duplicate detection
  requires_duplicate_detection = true
  duplicate_detection_history_time_window = "PT10M"
}

# Topic: Application Events
resource "azurerm_servicebus_topic" "application_events" {
  name         = "application-events"
  namespace_id = azurerm_servicebus_namespace.main.id

  # Topic settings
  max_size_in_megabytes              = var.sku == "Premium" ? 81920 : 5120
  default_message_ttl                = "P14D"  # 14 days
  enable_batched_operations          = true
  enable_express                     = var.sku == "Standard" ? true : false
  enable_partitioning                = var.sku == "Standard" ? true : false
  support_ordering                   = true

  # Duplicate detection
  requires_duplicate_detection = true
  duplicate_detection_history_time_window = "PT10M"
}

# Subscription: Application Created Events
resource "azurerm_servicebus_subscription" "application_created" {
  name               = "application-created"
  topic_id           = azurerm_servicebus_topic.application_events.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P14D"

  dead_lettering_on_message_expiration = true
  enable_batched_operations            = true
}

# Subscription: Application Updated Events
resource "azurerm_servicebus_subscription" "application_updated" {
  name               = "application-updated"
  topic_id           = azurerm_servicebus_topic.application_events.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P14D"

  dead_lettering_on_message_expiration = true
  enable_batched_operations            = true
}

# Subscription: Application Completed Events
resource "azurerm_servicebus_subscription" "application_completed" {
  name               = "application-completed"
  topic_id           = azurerm_servicebus_topic.application_events.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P14D"

  dead_lettering_on_message_expiration = true
  enable_batched_operations            = true
}

# Subscription: Analytics Aggregation
resource "azurerm_servicebus_subscription" "analytics_aggregation" {
  name               = "analytics-aggregation"
  topic_id           = azurerm_servicebus_topic.application_events.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P30D"

  dead_lettering_on_message_expiration = true
  enable_batched_operations            = true
}

# Authorization Rule: Root Manage Shared Access Key
resource "azurerm_servicebus_namespace_authorization_rule" "main" {
  name         = "RootManageSharedAccessKey"
  namespace_id = azurerm_servicebus_namespace.main.id

  listen = true
  send   = true
  manage = true
}
