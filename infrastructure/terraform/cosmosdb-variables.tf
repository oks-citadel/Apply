# ============================================================================
# CosmosDB Variables
# ============================================================================

variable "enable_cosmosdb" {
  description = "Enable CosmosDB deployment for NoSQL data storage"
  type        = bool
  default     = false
}

variable "cosmosdb_consistency_level" {
  description = "Consistency level for CosmosDB (Strong, BoundedStaleness, Session, ConsistentPrefix, Eventual)"
  type        = string
  default     = "Session"

  validation {
    condition     = contains(["Strong", "BoundedStaleness", "Session", "ConsistentPrefix", "Eventual"], var.cosmosdb_consistency_level)
    error_message = "Consistency level must be one of: Strong, BoundedStaleness, Session, ConsistentPrefix, Eventual"
  }
}

variable "cosmosdb_geo_locations" {
  description = "Additional geo locations for multi-region CosmosDB distribution"
  type = list(object({
    location          = string
    failover_priority = number
    zone_redundant    = bool
  }))
  default = []
  # Example for production:
  # default = [
  #   {
  #     location          = "westus2"
  #     failover_priority = 1
  #     zone_redundant    = true
  #   }
  # ]
}
