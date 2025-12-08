# Kong API Gateway Deployment Checklist

Use this checklist to ensure a successful Kong API Gateway deployment.

## Pre-Deployment

### Environment Preparation
- [ ] Kubernetes cluster is running and accessible
- [ ] kubectl is installed and configured
- [ ] Cluster has sufficient resources
  - [ ] At least 2 CPU cores available
  - [ ] At least 2GB RAM available
  - [ ] LoadBalancer service support (for external access)
- [ ] Namespace 'kong' is available (or can be created)

### Backend Services
- [ ] All backend services are deployed
- [ ] Services are accessible within the cluster
- [ ] Health check endpoints are working
  - [ ] auth-service:3001
  - [ ] user-service:3002
  - [ ] resume-service:3003
  - [ ] job-service:3004
  - [ ] auto-apply-service:3005
  - [ ] analytics-service:3006
  - [ ] notification-service:3007
  - [ ] ai-service:8000
  - [ ] orchestrator-service:3009

### Configuration Review
- [ ] Review kong-config.yaml
- [ ] Verify all service URLs are correct
- [ ] Check rate limit settings
- [ ] Review CORS configuration
- [ ] Verify timeout settings

## Deployment

### Validation
- [ ] Run validation script
  ```bash
  ./validate.sh
  ```
- [ ] All YAML files are valid
- [ ] Kustomize configuration is valid
- [ ] Kong configuration is valid

### Initial Deployment
- [ ] Choose deployment environment (base/dev/staging/production)
- [ ] Run deployment script
  ```bash
  ./deploy.sh <environment>
  ```
- [ ] Monitor deployment progress
- [ ] Verify all pods are running
  ```bash
  kubectl get pods -n kong
  ```

### Post-Deployment Verification
- [ ] Pods are in Running state
- [ ] All replicas are ready
- [ ] Services are created
  ```bash
  kubectl get svc -n kong
  ```
- [ ] LoadBalancer IP is assigned
- [ ] ConfigMap is mounted correctly

## Testing

### Health Checks
- [ ] Access Kong admin API
  ```bash
  kubectl port-forward -n kong svc/kong-admin 8001:8001
  curl http://localhost:8001/status
  ```
- [ ] Verify Kong is healthy
- [ ] Check Kong version
  ```bash
  kubectl exec -n kong deployment/kong -- kong version
  ```

### Configuration Validation
- [ ] Validate Kong configuration
  ```bash
  kubectl exec -n kong deployment/kong -- kong config parse /etc/kong/kong.yml
  ```
- [ ] Verify all services are configured
  ```bash
  curl http://localhost:8001/services
  ```
- [ ] Verify all routes are configured
  ```bash
  curl http://localhost:8001/routes
  ```
- [ ] Check plugin configuration
  ```bash
  curl http://localhost:8001/plugins
  ```

### Route Testing
- [ ] Run route testing script
  ```bash
  ./test-routes.sh
  ```
- [ ] Test each service endpoint
  - [ ] /api/v1/auth
  - [ ] /api/v1/users
  - [ ] /api/v1/profiles
  - [ ] /api/v1/resumes
  - [ ] /api/v1/jobs
  - [ ] /api/v1/companies
  - [ ] /api/v1/applications
  - [ ] /api/v1/auto-apply
  - [ ] /api/v1/analytics
  - [ ] /api/v1/notifications
  - [ ] /api/v1/ai
  - [ ] /api/v1/orchestrator

### Feature Testing
- [ ] Test rate limiting
  - [ ] Verify rate limit headers
  - [ ] Test limit enforcement
  - [ ] Verify AI service has stricter limits (50 req/min)
- [ ] Test CORS
  - [ ] Verify CORS headers
  - [ ] Test preflight requests
- [ ] Test correlation IDs
  - [ ] Verify X-Request-ID header is present
  - [ ] Verify ID is propagated
- [ ] Test error handling
  - [ ] 404 for non-existent routes
  - [ ] 429 when rate limited
  - [ ] 503 when backend is down

### Performance Testing
- [ ] Baseline performance test
- [ ] Load test (if applicable)
- [ ] Check resource usage
  ```bash
  kubectl top pods -n kong
  ```
- [ ] Monitor memory consumption
- [ ] Monitor CPU usage

## Monitoring Setup

### Prometheus Integration
- [ ] Verify metrics endpoint
  ```bash
  curl http://localhost:8001/metrics
  ```
- [ ] Check metrics are being collected
- [ ] Verify Prometheus is scraping Kong
- [ ] Set up Grafana dashboards (optional)

### Logging
- [ ] Verify logs are being written
  ```bash
  kubectl logs -n kong -l app=kong
  ```
- [ ] Check log format (JSON)
- [ ] Verify correlation IDs in logs
- [ ] Configure log aggregation (optional)
  - [ ] Loki
  - [ ] ELK
  - [ ] Cloud provider logging

### Alerts
- [ ] Set up basic alerts
  - [ ] Pod health
  - [ ] High error rate
  - [ ] High latency
  - [ ] Rate limit threshold
  - [ ] Memory/CPU usage

## Security Hardening

### Basic Security
- [ ] Review CORS configuration
- [ ] Enable rate limiting
- [ ] Configure timeouts
- [ ] Review service access

### Production Security (for production deployments)
- [ ] Configure SSL/TLS certificates
- [ ] Enable HTTPS only
- [ ] Update CORS to specific domains
- [ ] Enable JWT authentication
- [ ] Configure API keys (if needed)
- [ ] Set up network policies
- [ ] Enable audit logging
- [ ] Review and harden admin API access

### Secrets Management
- [ ] SSL certificates stored in Kubernetes secrets
- [ ] API keys stored securely
- [ ] JWT secrets configured
- [ ] No sensitive data in ConfigMaps

## High Availability

### Scaling
- [ ] Verify number of replicas (2 for base, 3 for production)
- [ ] Test pod failover
- [ ] Verify anti-affinity rules
- [ ] Configure HPA (optional)
  ```yaml
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: kong-hpa
    namespace: kong
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: kong
    minReplicas: 2
    maxReplicas: 10
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  ```

### Resilience
- [ ] Test pod restart
- [ ] Test node failure (if multi-node cluster)
- [ ] Verify graceful shutdown
- [ ] Test configuration reload

## Documentation

### Update Documentation
- [ ] Document LoadBalancer IP/URL
- [ ] Update frontend configuration with Kong URL
- [ ] Document any custom configurations
- [ ] Update runbook with operational procedures

### Knowledge Transfer
- [ ] Share deployment details with team
- [ ] Document troubleshooting steps
- [ ] Create incident response plan
- [ ] Set up on-call procedures

## Production-Specific (Production Only)

### DNS Configuration
- [ ] Create DNS record for API gateway
  - [ ] Example: api.jobpilot.com
- [ ] Verify DNS resolution
- [ ] Configure SSL for custom domain

### SSL/TLS
- [ ] Install SSL certificates
- [ ] Verify HTTPS works
- [ ] Test SSL configuration
- [ ] Enable HTTP to HTTPS redirect

### Performance
- [ ] Conduct load testing
- [ ] Optimize resource allocation
- [ ] Fine-tune rate limits
- [ ] Configure caching (if needed)

### Compliance
- [ ] Review security policies
- [ ] Audit logging enabled
- [ ] Data retention policies configured
- [ ] Privacy compliance verified

## Post-Deployment

### Monitoring
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Review metrics
- [ ] Verify no performance degradation

### Frontend Integration
- [ ] Update frontend to use Kong URL
- [ ] Test end-to-end flows
- [ ] Verify all features work
- [ ] Monitor user reports

### Rollback Plan
- [ ] Document rollback procedure
- [ ] Test rollback (in non-production)
- [ ] Keep previous configuration backup

### Optimization
- [ ] Review performance metrics
- [ ] Optimize resource allocation
- [ ] Fine-tune timeouts
- [ ] Adjust rate limits based on usage

## Sign-Off

### Deployment Team
- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] Environment: ________________

### Verification
- [ ] Tested by: ________________
- [ ] Date: ________________
- [ ] All tests passed: Yes / No

### Approval
- [ ] Approved by: ________________
- [ ] Date: ________________
- [ ] Ready for production: Yes / No

## Rollback Procedure

If issues occur, follow this rollback procedure:

```bash
# 1. Delete current deployment
kubectl delete -k infrastructure/kubernetes/api-gateway/

# 2. Restore previous configuration (if backed up)
kubectl apply -f backup/

# 3. Verify rollback
kubectl get pods -n kong
kubectl logs -n kong -l app=kong

# 4. Update frontend to use direct service URLs (temporary)
```

## Emergency Contacts

- DevOps Team: ________________
- Platform Owner: ________________
- On-Call Engineer: ________________

## Notes

Add any deployment-specific notes here:

---

**Checklist Version:** 1.0
**Last Updated:** 2025-12-07
