# PostgreSQL Public Access - Quick Reference Card

**Status:** ✓ Public Access Enabled (NO VNET)
**Security:** ✓ SSL Required + IP Firewall
**Last Verified:** 2025-12-15

---

## Quick Facts

```
Architecture:    PUBLIC (no VNet integration)
SSL/TLS:         REQUIRED (enforced)
Port:            5432
Firewall:        IP-based + AllowAzureServices
Databases:       8 (one per microservice)
```

---

## Configuration Verification

### 1. Public Access Confirmed
```hcl
# infrastructure/terraform/modules/postgresql-flexible/main.tf:35
public_network_access_enabled = true ✓
```

### 2. NO VNet Integration
```
delegated_subnet_id   = NOT CONFIGURED ✓
private_dns_zone_id   = NOT CONFIGURED ✓
```

### 3. SSL Enforced
```hcl
# infrastructure/terraform/modules/postgresql-flexible/main.tf:67-71
require_secure_transport = "on" ✓
```

### 4. Firewall Rules Active
```hcl
# Rule 1: AllowAzureServices (enables AKS access)
start_ip_address = "0.0.0.0"  # Azure-specific notation ✓

# Rule 2: Specific IPs (configurable)
allowed_ip_addresses = []  # Add IPs as needed
```

---

## Connection String

```bash
# Standard Format
postgresql://applyforusadmin:<password>@HOST:5432/DATABASE?sslmode=require

# WHERE:
# HOST = psql-jobpilot-{env}-{suffix}.postgres.database.azure.com
# DATABASE = auth_service_db, user_service_db, etc.
```

---

## Access Patterns

| From | Method | Firewall Rule Required |
|------|--------|----------------------|
| AKS Pods | AllowAzureServices | ✓ Enabled by default |
| GitHub Actions | AllowAzureServices | ✓ Enabled by default |
| Developer Machine | Specific IP | ⚠️ Add your IP |
| CI/CD (self-hosted) | Specific IP | ⚠️ Add runner IP |

---

## Add Your IP (Quick)

**Azure CLI:**
```bash
az postgres flexible-server firewall-rule create \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --rule-name allow-my-ip \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

**Terraform:**
```hcl
# infrastructure/terraform/main.tf:231
allowed_ip_addresses = [
  "YOUR_IP/32",
]
```

---

## Test Connection

```bash
# From AKS pod
kubectl exec -it <pod> -n applyforus -- \
  psql "postgresql://user:pass@host:5432/auth_service_db?sslmode=require" \
  -c "SELECT version();"

# From local machine (after adding your IP)
psql "postgresql://user:pass@host:5432/auth_service_db?sslmode=require" \
  -c "SELECT 1;"
```

---

## Security Checklist

- [x] SSL/TLS enforced
- [x] AllowAzureServices enabled (for AKS)
- [ ] Add specific IPs for developers/CI (as needed)
- [ ] Password stored in Azure Key Vault
- [ ] Connection strings use `?sslmode=require`
- [x] Database isolation (8 separate databases)
- [x] Strong password policy (12+ chars)
- [x] Diagnostic logging enabled

---

## Environment Variables (Per Service)

```bash
DB_HOST=psql-jobpilot-prod-<suffix>.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=<from-keyvault>
DB_DATABASE=<service>_db  # e.g., auth_service_db
DB_SSL=true
```

---

## 8 Databases

1. `auth_service_db` - Authentication & sessions
2. `user_service_db` - User profiles
3. `job_service_db` - Job listings
4. `resume_service_db` - Resume storage
5. `notification_service_db` - Notifications
6. `analytics_service_db` - Analytics data
7. `auto_apply_service_db` - Application queue
8. `payment_service_db` - Billing & subscriptions

---

## Common Commands

```bash
# List firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group <rg> --name <server> --output table

# Show server details
az postgres flexible-server show \
  --resource-group <rg> --name <server>

# Get Terraform outputs
terraform output postgresql_server_fqdn
terraform output postgresql_database_names
```

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| No pg_hba.conf entry | IP not in firewall | Add your IP |
| SSL connection required | Missing SSL param | Add `?sslmode=require` |
| Connection refused | Network/DNS issue | Check AKS egress |
| Authentication failed | Wrong credentials | Check Key Vault |

---

## Documentation

- **Full Guide:** `ops/docs/postgres-public-connectivity.md`
- **Verification Report:** `POSTGRES_PUBLIC_ACCESS_VERIFICATION_REPORT.md`
- **Quick Reference:** `infrastructure/terraform/POSTGRESQL_QUICK_REFERENCE.md`

---

## Terraform Files

```
infrastructure/terraform/
  ├── main.tf (lines 197-262)           # Module invocation
  ├── variables.tf (lines 90-117)       # Variables
  ├── outputs.tf (lines 185-275)        # Outputs
  └── modules/postgresql-flexible/
      ├── main.tf                        # ✓ PUBLIC ACCESS
      ├── variables.tf                   # Configuration options
      └── outputs.tf                     # Connection strings
```

---

## Contact

**Infrastructure:** infrastructure@applyforus.com
**Security:** security@applyforus.com
**DevOps:** devops@applyforus.com

---

**Status:** ✓ Production Ready | **Last Updated:** 2025-12-15
