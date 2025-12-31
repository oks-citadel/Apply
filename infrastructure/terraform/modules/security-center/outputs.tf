output "defender_enabled_resources" {
  description = "List of resource types with Defender enabled"
  value = [
    "VirtualMachines",
    "Containers",
    "KeyVaults",
    "StorageAccounts",
    "AppServices",
    "SqlServers",
    "Arm",
    "Dns"
  ]
}

output "security_contact_configured" {
  description = "Whether security contact is configured"
  value       = true
}

output "auto_provisioning_enabled" {
  description = "Whether auto-provisioning is enabled"
  value       = var.enable_auto_provisioning
}

output "security_benchmark_enabled" {
  description = "Whether Azure Security Benchmark is enabled"
  value       = var.enable_security_benchmark
}
