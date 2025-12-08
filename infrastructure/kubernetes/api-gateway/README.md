# Kong API Gateway for JobPilot AI Platform

This directory contains Kubernetes manifests for deploying Kong API Gateway as the central entry point for all JobPilot microservices.

## Overview

Kong serves as the API Gateway, providing:
- **Unified Entry Point**: Single point of access for all backend services
- **Rate Limiting**: Protects services from overload
- **Authentication**: JWT-based authentication
- **CORS**: Cross-origin resource sharing support
- **Monitoring**: Prometheus metrics integration
- **Request Tracking**: Correlation IDs for distributed tracing
- **Logging**: Centralized request/response logging

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     External Traffic                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  LoadBalancer Service │
            │  (Port 80/443)        │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   Kong Deployment    │
            │   (2 Replicas)       │
            │                      │
            │  - Proxy: 8000/8443  │
            │  - Admin: 8001       │
            └──────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌─────────┐              ┌─────────┐
    │ Backend │              │ Backend │
    │Services │              │Services │
    └─────────┘              └─────────┘
```

## Components

### 1. Namespace (`namespace.yaml`)
Creates the `kong` namespace for isolating Kong resources.

### 2. Deployment (`kong-deployment.yaml`)
Deploys Kong with:
- **Image**: Kong 3.4
- **Replicas**: 2 for high availability
- **Mode**: Database-less (declarative config)
- **Resources**: 500m-1000m CPU, 512Mi-1Gi memory
- **Health Checks**: Liveness and readiness probes

### 3. Service (`kong-service.yaml`)
Exposes Kong through two services:
- **kong-proxy**: LoadBalancer (external access on ports 80/443)
- **kong-admin**: ClusterIP (internal admin API on port 8001)

### 4. Configuration (`kong-config.yaml`)
Declarative configuration containing:
- **Services**: All 10 backend microservices
- **Routes**: API path mappings
- **Plugins**: Global and service-specific plugins

### 5. Kustomization (`kustomization.yaml`)
Orchestrates all Kong resources for easy deployment.

## Services Configuration

| Service | Internal URL | External Path | Port |
|---------|-------------|---------------|------|
| Auth Service | auth-service.default:3001 | /api/v1/auth | 3001 |
| User Service | user-service.default:3002 | /api/v1/users, /api/v1/profiles | 3002 |
| Resume Service | resume-service.default:3003 | /api/v1/resumes | 3003 |
| Job Service | job-service.default:3004 | /api/v1/jobs, /api/v1/companies | 3004 |
| Auto Apply Service | auto-apply-service.default:3005 | /api/v1/applications, /api/v1/auto-apply | 3005 |
| Analytics Service | analytics-service.default:3006 | /api/v1/analytics | 3006 |
| Notification Service | notification-service.default:3007 | /api/v1/notifications | 3007 |
| AI Service | ai-service.default:8000 | /api/v1/ai | 8000 |
| Orchestrator Service | orchestrator-service.default:3009 | /api/v1/orchestrator | 3009 |

## Plugins

### Global Plugins (Applied to All Services)

1. **CORS**
   - Allows cross-origin requests
   - Configurable origins (update in production)
   - Credentials support

2. **Rate Limiting**
   - Default: 100 requests/minute, 5000 requests/hour
   - Policy: Local (in-memory)
   - Limit by: IP address

3. **Prometheus**
   - Exposes metrics at `/metrics` endpoint
   - Per-consumer metrics
   - Status code, latency, and bandwidth metrics

4. **Request Logging**
   - Logs to stdout (JSON format)
   - Includes correlation IDs

5. **Correlation ID**
   - Generates unique request IDs
   - Header: X-Request-ID
   - Propagated to backend services

### Service-Specific Plugins

#### AI Service
- **Stricter Rate Limiting**: 50 requests/minute, 2000 requests/hour
- Reason: AI operations are computationally expensive

## Deployment

### Prerequisites
- Kubernetes cluster (AKS recommended)
- kubectl configured
- All backend services deployed

### Deploy Kong

```bash
# Deploy using kubectl
kubectl apply -k infrastructure/kubernetes/api-gateway/

# Verify deployment
kubectl get all -n kong

# Check Kong status
kubectl logs -n kong -l app=kong

# Get LoadBalancer IP
kubectl get svc -n kong kong-proxy
```

### Deploy with Kustomize

```bash
# Production deployment
kubectl apply -k infrastructure/kubernetes/api-gateway/

# Development overlay (if created)
kubectl apply -k infrastructure/kubernetes/api-gateway/overlays/dev/

# Staging overlay (if created)
kubectl apply -k infrastructure/kubernetes/api-gateway/overlays/staging/
```

## Testing

### Health Check

```bash
# Get Kong LoadBalancer IP
KONG_IP=$(kubectl get svc -n kong kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Check Kong health
curl http://$KONG_IP/status
```

### Test Routes

```bash
# Test auth service
curl http://$KONG_IP/api/v1/auth/health

# Test user service
curl http://$KONG_IP/api/v1/users/health

# Test with rate limiting
for i in {1..10}; do
  curl -I http://$KONG_IP/api/v1/auth/health
done
```

### Admin API (Internal)

```bash
# Port-forward to admin API
kubectl port-forward -n kong svc/kong-admin 8001:8001

# List services
curl http://localhost:8001/services

# List routes
curl http://localhost:8001/routes

# Check metrics
curl http://localhost:8001/metrics
```

## Monitoring

### Prometheus Metrics

Kong exposes Prometheus metrics at the `/metrics` endpoint:

```bash
# Port-forward to admin API
kubectl port-forward -n kong svc/kong-admin 8001:8001

# Get metrics
curl http://localhost:8001/metrics
```

### Key Metrics
- `kong_http_status`: HTTP status codes
- `kong_latency`: Request latency
- `kong_bandwidth`: Bandwidth usage
- `kong_datastore_reachable`: Database connectivity (N/A in DB-less mode)

## Configuration Updates

### Updating Kong Configuration

1. Edit `kong-config.yaml`
2. Apply changes:
   ```bash
   kubectl apply -f infrastructure/kubernetes/api-gateway/kong-config.yaml
   ```
3. Restart Kong pods to reload configuration:
   ```bash
   kubectl rollout restart deployment/kong -n kong
   ```

### Adding a New Service

1. Add service definition to `kong-config.yaml`:
   ```yaml
   - name: new-service
     url: http://new-service.default.svc.cluster.local:3010
     routes:
       - name: new-service-routes
         paths:
           - /api/v1/new-service
   ```

2. Apply and restart:
   ```bash
   kubectl apply -f infrastructure/kubernetes/api-gateway/kong-config.yaml
   kubectl rollout restart deployment/kong -n kong
   ```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n kong

# Check logs
kubectl logs -n kong -l app=kong

# Describe pod
kubectl describe pod -n kong -l app=kong
```

### Configuration Errors

```bash
# Validate Kong configuration
kubectl exec -it -n kong deployment/kong -- kong config parse /etc/kong/kong.yml

# Check for syntax errors in ConfigMap
kubectl get configmap -n kong kong-config -o yaml
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n kong

# Verify backend service is running
kubectl get pods -n default

# Check Kong logs for errors
kubectl logs -n kong -l app=kong --tail=100
```

### Rate Limiting Issues

```bash
# Check rate limit headers in response
curl -I http://$KONG_IP/api/v1/auth/health

# Look for:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1234567890
```

## Security Considerations

### Production Configuration

Before deploying to production:

1. **Update CORS origins**: Change from `*` to specific domains
   ```yaml
   origins:
     - https://app.jobpilot.com
     - https://api.jobpilot.com
   ```

2. **Enable JWT authentication**: Add JWT plugin for protected routes
   ```yaml
   plugins:
     - name: jwt
       config:
         key_claim_name: iss
   ```

3. **Enable HTTPS**: Add SSL certificates
   ```yaml
   - name: acme
     config:
       account_email: admin@jobpilot.com
       domains:
         - api.jobpilot.com
   ```

4. **Restrict Admin API**: Ensure admin API is only accessible internally

5. **Update rate limits**: Adjust based on expected traffic

## Environment Overlays

Create environment-specific configurations using Kustomize overlays:

### Development
```bash
infrastructure/kubernetes/api-gateway/overlays/dev/
├── kustomization.yaml
└── patches/
    └── deployment-patch.yaml
```

### Staging
```bash
infrastructure/kubernetes/api-gateway/overlays/staging/
├── kustomization.yaml
└── patches/
    └── deployment-patch.yaml
```

### Production
```bash
infrastructure/kubernetes/api-gateway/overlays/production/
├── kustomization.yaml
├── ssl-certificates.yaml
└── patches/
    ├── deployment-patch.yaml
    └── config-patch.yaml
```

## Additional Resources

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Kubernetes Deployment](https://docs.konghq.com/kubernetes-ingress-controller/)
- [Kong Plugin Hub](https://docs.konghq.com/hub/)
- [Declarative Configuration](https://docs.konghq.com/gateway/latest/production/deployment-topologies/db-less-and-declarative-config/)

## Support

For issues or questions:
1. Check Kong logs: `kubectl logs -n kong -l app=kong`
2. Review configuration: `kubectl get configmap -n kong kong-config -o yaml`
3. Consult Kong documentation: https://docs.konghq.com/
4. Check JobPilot documentation in `/docs` directory
