# Kong API Gateway - Quick Start Guide

## TL;DR

```bash
# Deploy Kong
cd infrastructure/kubernetes/api-gateway
./deploy.sh base

# Get Kong URL
kubectl get svc -n kong kong-proxy

# Test routes
./test-routes.sh
```

## Prerequisites

- [x] Kubernetes cluster running
- [x] kubectl configured
- [x] Backend services deployed
- [x] Sufficient cluster resources

## Deployment

### Base Deployment (Development/Testing)

```bash
# Navigate to api-gateway directory
cd infrastructure/kubernetes/api-gateway

# Validate configuration
./validate.sh

# Deploy Kong
./deploy.sh base

# Wait for Kong to be ready
kubectl wait --for=condition=available --timeout=300s deployment/kong -n kong

# Get LoadBalancer IP
kubectl get svc -n kong kong-proxy
```

### Environment-Specific Deployment

```bash
# Development
./deploy.sh dev

# Staging
./deploy.sh staging

# Production (requires SSL setup)
./deploy.sh production
```

## Verification

### Check Deployment Status

```bash
# Check pods
kubectl get pods -n kong

# Check services
kubectl get svc -n kong

# Check logs
kubectl logs -n kong -l app=kong -f
```

### Access Admin API

```bash
# Port-forward to admin API
kubectl port-forward -n kong svc/kong-admin 8001:8001

# Check status
curl http://localhost:8001/status

# List services
curl http://localhost:8001/services | jq

# List routes
curl http://localhost:8001/routes | jq

# View metrics
curl http://localhost:8001/metrics
```

### Test Routes

```bash
# Get Kong IP
export KONG_IP=$(kubectl get svc -n kong kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test auth service
curl http://$KONG_IP/api/v1/auth/health

# Test user service
curl http://$KONG_IP/api/v1/users/health

# Test with headers
curl -H "Origin: http://example.com" http://$KONG_IP/api/v1/auth/health

# Check rate limit headers
curl -I http://$KONG_IP/api/v1/auth/health
```

## Common Operations

### Update Configuration

```bash
# Edit configuration
nano kong-config.yaml

# Apply changes
kubectl apply -f kong-config.yaml

# Restart Kong
kubectl rollout restart deployment/kong -n kong

# Verify
kubectl exec -n kong deployment/kong -- kong config parse /etc/kong/kong.yml
```

### Scale Kong

```bash
# Scale to 3 replicas
kubectl scale deployment/kong -n kong --replicas=3

# Verify
kubectl get pods -n kong
```

### View Logs

```bash
# All pods
kubectl logs -n kong -l app=kong -f

# Specific pod
kubectl logs -n kong <pod-name> -f

# Previous pod instance
kubectl logs -n kong <pod-name> --previous
```

### Restart Kong

```bash
# Rolling restart
kubectl rollout restart deployment/kong -n kong

# Check rollout status
kubectl rollout status deployment/kong -n kong
```

## Troubleshooting

### Pods Not Starting

```bash
# Check events
kubectl get events -n kong --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod -n kong -l app=kong

# Check logs
kubectl logs -n kong -l app=kong
```

### Configuration Errors

```bash
# Validate configuration
kubectl exec -n kong deployment/kong -- kong config parse /etc/kong/kong.yml

# Check ConfigMap
kubectl get configmap -n kong kong-config -o yaml
```

### Routes Not Working

```bash
# Check service endpoints
kubectl get endpoints -n kong

# Verify backend services
kubectl get pods -n default

# Test from within cluster
kubectl run test-pod --rm -it --image=curlimages/curl -- sh
curl http://kong-proxy.kong.svc.cluster.local/api/v1/auth/health
```

### Rate Limiting Issues

```bash
# Check headers
curl -I http://$KONG_IP/api/v1/auth/health | grep RateLimit

# Test rate limit
for i in {1..10}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" http://$KONG_IP/api/v1/auth/health
done
```

## Service Endpoints

| Service | Path | Backend |
|---------|------|---------|
| Auth | /api/v1/auth | auth-service:3001 |
| User | /api/v1/users | user-service:3002 |
| Profile | /api/v1/profiles | user-service:3002 |
| Resume | /api/v1/resumes | resume-service:3003 |
| Job | /api/v1/jobs | job-service:3004 |
| Company | /api/v1/companies | job-service:3004 |
| Application | /api/v1/applications | auto-apply-service:3005 |
| Auto Apply | /api/v1/auto-apply | auto-apply-service:3005 |
| Analytics | /api/v1/analytics | analytics-service:3006 |
| Notification | /api/v1/notifications | notification-service:3007 |
| AI | /api/v1/ai | ai-service:8000 |
| Orchestrator | /api/v1/orchestrator | orchestrator-service:3009 |

## Useful Commands

```bash
# Get Kong version
kubectl exec -n kong deployment/kong -- kong version

# Check Kong health
kubectl exec -n kong deployment/kong -- wget -q -O - http://localhost:8001/status

# List all Kong resources
kubectl get all -n kong

# Delete Kong deployment
kubectl delete -k .

# Re-deploy Kong
kubectl apply -k .

# Export Kong configuration
kubectl get configmap -n kong kong-config -o jsonpath='{.data.kong\.yml}' > kong-export.yml

# Get LoadBalancer IP
kubectl get svc -n kong kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Port-forward proxy
kubectl port-forward -n kong svc/kong-proxy 8000:80

# Port-forward admin
kubectl port-forward -n kong svc/kong-admin 8001:8001
```

## Plugin Configuration

### Rate Limiting
- Default: 100 req/min, 5000 req/hour
- AI Service: 50 req/min, 2000 req/hour

### CORS
- Enabled globally
- Update origins for production

### Prometheus
- Metrics: http://localhost:8001/metrics
- Per-consumer metrics enabled

### Logging
- Logs to stdout (JSON format)
- Includes correlation IDs

## Production Checklist

- [ ] Deploy to production namespace
- [ ] Configure SSL certificates
- [ ] Update CORS origins
- [ ] Enable JWT authentication
- [ ] Set up monitoring alerts
- [ ] Configure HPA
- [ ] Load test
- [ ] Security audit
- [ ] Document API endpoints
- [ ] Update DNS records

## Next Steps

1. Verify all routes are accessible
2. Test rate limiting functionality
3. Configure SSL for production
4. Enable authentication
5. Set up monitoring
6. Perform load testing
7. Update frontend to use Kong
8. Monitor and optimize

## Resources

- Full Documentation: [README.md](README.md)
- Implementation Summary: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- Kong Docs: https://docs.konghq.com/
- Plugin Hub: https://docs.konghq.com/hub/

## Support

Check logs first:
```bash
kubectl logs -n kong -l app=kong --tail=100
```

Common issues documented in [README.md](README.md#troubleshooting)
