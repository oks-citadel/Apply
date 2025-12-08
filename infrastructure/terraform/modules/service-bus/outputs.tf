# Service Bus Module Outputs

output "namespace_id" {
  description = "ID of the Service Bus namespace"
  value       = azurerm_servicebus_namespace.main.id
}

output "namespace_name" {
  description = "Name of the Service Bus namespace"
  value       = azurerm_servicebus_namespace.main.name
}

output "connection_string" {
  description = "Primary connection string for the Service Bus namespace"
  value       = azurerm_servicebus_namespace_authorization_rule.app.primary_connection_string
  sensitive   = true
}

output "queues" {
  description = "Map of queue names to their IDs"
  value = {
    job-applications  = azurerm_servicebus_queue.job_applications.id
    resume-processing = azurerm_servicebus_queue.resume_processing.id
    notifications     = azurerm_servicebus_queue.notifications.id
    analytics-events  = azurerm_servicebus_queue.analytics_events.id
  }
}

output "topics" {
  description = "Map of topic names to their IDs"
  value = {
    application-events = azurerm_servicebus_topic.application_events.id
  }
}

output "subscriptions" {
  description = "Map of subscription names to their IDs"
  value = {
    application-created    = azurerm_servicebus_subscription.application_created.id
    application-updated    = azurerm_servicebus_subscription.application_updated.id
    application-completed  = azurerm_servicebus_subscription.application_completed.id
    analytics-aggregation  = azurerm_servicebus_subscription.analytics_aggregation.id
  }
}

output "primary_key" {
  description = "Primary key for the Service Bus namespace"
  value       = azurerm_servicebus_namespace_authorization_rule.app.primary_key
  sensitive   = true
}

output "secondary_key" {
  description = "Secondary key for the Service Bus namespace"
  value       = azurerm_servicebus_namespace_authorization_rule.app.secondary_key
  sensitive   = true
}
