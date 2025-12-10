#!/bin/bash
# =============================================================================
# COMPREHENSIVE FIX SCRIPT FOR APPLYFORUS PLATFORM
# =============================================================================
# This script fixes all identified issues from the platform status report:
# 1. CRITICAL: Port misalignment in Dockerfiles
# 2. CRITICAL: Port misalignment in K8s manifests
# 3. MEDIUM: CORS/Domain updates (jobpilot.com -> applyforus.com)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "ApplyForUs Platform - Comprehensive Fix"
echo "========================================"
echo "Project Root: $PROJECT_ROOT"
echo ""

# =============================================================================
# PART 1: Fix Dockerfile Ports
# =============================================================================
echo "PART 1: Fixing Dockerfile ports..."
echo "-----------------------------------"

# Auth Service: 4000 -> 8001
echo "  - auth-service: 4000 -> 8001"
sed -i 's/ENV PORT=4000/ENV PORT=8001/g' "$PROJECT_ROOT/services/auth-service/Dockerfile"
sed -i 's/EXPOSE 4000/EXPOSE 8001/g' "$PROJECT_ROOT/services/auth-service/Dockerfile"
sed -i 's/localhost:4000/localhost:8001/g' "$PROJECT_ROOT/services/auth-service/Dockerfile"

# User Service: 4004 -> 8002
echo "  - user-service: 4004 -> 8002"
sed -i 's/ENV PORT=4004/ENV PORT=8002/g' "$PROJECT_ROOT/services/user-service/Dockerfile"
sed -i 's/EXPOSE 4004/EXPOSE 8002/g' "$PROJECT_ROOT/services/user-service/Dockerfile"
sed -i 's/localhost:4004/localhost:8002/g' "$PROJECT_ROOT/services/user-service/Dockerfile"

# Resume Service: 4001 -> 8003
echo "  - resume-service: 4001 -> 8003"
sed -i 's/ENV PORT=4001/ENV PORT=8003/g' "$PROJECT_ROOT/services/resume-service/Dockerfile"
sed -i 's/EXPOSE 4001/EXPOSE 8003/g' "$PROJECT_ROOT/services/resume-service/Dockerfile"
sed -i 's/localhost:4001/localhost:8003/g' "$PROJECT_ROOT/services/resume-service/Dockerfile"

# Job Service: 4002 -> 8004
echo "  - job-service: 4002 -> 8004"
sed -i 's/ENV PORT=4002/ENV PORT=8004/g' "$PROJECT_ROOT/services/job-service/Dockerfile"
sed -i 's/EXPOSE 4002/EXPOSE 8004/g' "$PROJECT_ROOT/services/job-service/Dockerfile"
sed -i 's/localhost:4002/localhost:8004/g' "$PROJECT_ROOT/services/job-service/Dockerfile"

# Auto-Apply Service: 4003 -> 8005
echo "  - auto-apply-service: 4003 -> 8005"
sed -i 's/ENV PORT=4003/ENV PORT=8005/g' "$PROJECT_ROOT/services/auto-apply-service/Dockerfile"
sed -i 's/EXPOSE 4003/EXPOSE 8005/g' "$PROJECT_ROOT/services/auto-apply-service/Dockerfile"
sed -i 's/localhost:4003/localhost:8005/g' "$PROJECT_ROOT/services/auto-apply-service/Dockerfile"

# Analytics Service: 3007 -> 8006
echo "  - analytics-service: 3007 -> 8006"
sed -i 's/ENV PORT=3007/ENV PORT=8006/g' "$PROJECT_ROOT/services/analytics-service/Dockerfile"
sed -i 's/EXPOSE 3007/EXPOSE 8006/g' "$PROJECT_ROOT/services/analytics-service/Dockerfile"
sed -i 's/localhost:3007/localhost:8006/g' "$PROJECT_ROOT/services/analytics-service/Dockerfile"

# Notification Service: 4005 -> 8007
echo "  - notification-service: 4005 -> 8007"
sed -i 's/ENV PORT=4005/ENV PORT=8007/g' "$PROJECT_ROOT/services/notification-service/Dockerfile"
sed -i 's/EXPOSE 4005/EXPOSE 8007/g' "$PROJECT_ROOT/services/notification-service/Dockerfile"
sed -i 's/localhost:4005/localhost:8007/g' "$PROJECT_ROOT/services/notification-service/Dockerfile"

# AI Service: 5000 -> 8008
echo "  - ai-service: 5000 -> 8008"
sed -i 's/PORT=5000/PORT=8008/g' "$PROJECT_ROOT/services/ai-service/Dockerfile"
sed -i 's/EXPOSE 5000/EXPOSE 8008/g' "$PROJECT_ROOT/services/ai-service/Dockerfile"
sed -i 's/localhost:5000/localhost:8008/g' "$PROJECT_ROOT/services/ai-service/Dockerfile"
sed -i 's/"--port", "5000"/"--port", "8008"/g' "$PROJECT_ROOT/services/ai-service/Dockerfile"

# Payment Service: 3000 -> 8009
echo "  - payment-service: 3000 -> 8009"
sed -i 's/EXPOSE 3000/EXPOSE 8009/g' "$PROJECT_ROOT/services/payment-service/Dockerfile"
sed -i 's/localhost:3000/localhost:8009/g' "$PROJECT_ROOT/services/payment-service/Dockerfile"

# Orchestrator Service: 3009 -> 8010
echo "  - orchestrator-service: 3009 -> 8010"
sed -i 's/ENV PORT=3009/ENV PORT=8010/g' "$PROJECT_ROOT/services/orchestrator-service/Dockerfile"
sed -i 's/EXPOSE 3009/EXPOSE 8010/g' "$PROJECT_ROOT/services/orchestrator-service/Dockerfile"
sed -i 's/localhost:3009/localhost:8010/g' "$PROJECT_ROOT/services/orchestrator-service/Dockerfile"

echo "  ✓ Dockerfiles updated"
echo ""

# =============================================================================
# PART 2: Fix Kubernetes Manifest Ports
# =============================================================================
echo "PART 2: Fixing Kubernetes manifest ports..."
echo "-------------------------------------------"

K8S_DIR="$PROJECT_ROOT/infrastructure/kubernetes/services"

# Auth Service K8s
echo "  - auth-service.yaml: 4000 -> 8001"
sed -i 's/: "4000"/: "8001"/g' "$K8S_DIR/auth-service.yaml"
sed -i 's/: 4000/: 8001/g' "$K8S_DIR/auth-service.yaml"
sed -i 's/containerPort: 4000/containerPort: 8001/g' "$K8S_DIR/auth-service.yaml"
sed -i 's/targetPort: 4000/targetPort: 8001/g' "$K8S_DIR/auth-service.yaml"

# User Service K8s
echo "  - user-service.yaml: 4004 -> 8002"
sed -i 's/: "4004"/: "8002"/g' "$K8S_DIR/user-service.yaml"
sed -i 's/: 4004/: 8002/g' "$K8S_DIR/user-service.yaml"
sed -i 's/containerPort: 4004/containerPort: 8002/g' "$K8S_DIR/user-service.yaml"
sed -i 's/targetPort: 4004/targetPort: 8002/g' "$K8S_DIR/user-service.yaml"

# Resume Service K8s
echo "  - resume-service.yaml: 4001 -> 8003"
sed -i 's/: "4001"/: "8003"/g' "$K8S_DIR/resume-service.yaml"
sed -i 's/: 4001/: 8003/g' "$K8S_DIR/resume-service.yaml"
sed -i 's/containerPort: 4001/containerPort: 8003/g' "$K8S_DIR/resume-service.yaml"
sed -i 's/targetPort: 4001/targetPort: 8003/g' "$K8S_DIR/resume-service.yaml"

# Job Service K8s
echo "  - job-service.yaml: 4002 -> 8004"
sed -i 's/: "4002"/: "8004"/g' "$K8S_DIR/job-service.yaml"
sed -i 's/: 4002/: 8004/g' "$K8S_DIR/job-service.yaml"
sed -i 's/containerPort: 4002/containerPort: 8004/g' "$K8S_DIR/job-service.yaml"
sed -i 's/targetPort: 4002/targetPort: 8004/g' "$K8S_DIR/job-service.yaml"

# Auto-Apply Service K8s
echo "  - auto-apply-service.yaml: 4003 -> 8005"
sed -i 's/: "4003"/: "8005"/g' "$K8S_DIR/auto-apply-service.yaml"
sed -i 's/: 4003/: 8005/g' "$K8S_DIR/auto-apply-service.yaml"
sed -i 's/containerPort: 4003/containerPort: 8005/g' "$K8S_DIR/auto-apply-service.yaml"
sed -i 's/targetPort: 4003/targetPort: 8005/g' "$K8S_DIR/auto-apply-service.yaml"

# Analytics Service K8s
echo "  - analytics-service.yaml: 3007 -> 8006"
sed -i 's/: "3007"/: "8006"/g' "$K8S_DIR/analytics-service.yaml"
sed -i 's/: 3007/: 8006/g' "$K8S_DIR/analytics-service.yaml"
sed -i 's/containerPort: 3007/containerPort: 8006/g' "$K8S_DIR/analytics-service.yaml"
sed -i 's/targetPort: 3007/targetPort: 8006/g' "$K8S_DIR/analytics-service.yaml"

# Notification Service K8s
echo "  - notification-service.yaml: 4005 -> 8007"
sed -i 's/: "4005"/: "8007"/g' "$K8S_DIR/notification-service.yaml"
sed -i 's/: 4005/: 8007/g' "$K8S_DIR/notification-service.yaml"
sed -i 's/containerPort: 4005/containerPort: 8007/g' "$K8S_DIR/notification-service.yaml"
sed -i 's/targetPort: 4005/targetPort: 8007/g' "$K8S_DIR/notification-service.yaml"

# AI Service K8s
echo "  - ai-service.yaml: 5000 -> 8008"
sed -i 's/: "5000"/: "8008"/g' "$K8S_DIR/ai-service.yaml"
sed -i 's/: 5000/: 8008/g' "$K8S_DIR/ai-service.yaml"
sed -i 's/containerPort: 5000/containerPort: 8008/g' "$K8S_DIR/ai-service.yaml"
sed -i 's/targetPort: 5000/targetPort: 8008/g' "$K8S_DIR/ai-service.yaml"

# Orchestrator Service K8s
echo "  - orchestrator-service.yaml: 3009 -> 8010 + inter-service URLs"
sed -i 's/: "3009"/: "8010"/g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's/: 3009/: 8010/g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's/containerPort: 3009/containerPort: 8010/g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's/targetPort: 3009/targetPort: 8010/g' "$K8S_DIR/orchestrator-service.yaml"

# Fix inter-service URLs in orchestrator
sed -i 's|http://auth-service:4000|http://auth-service:8001|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://user-service:4004|http://user-service:8002|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://resume-service:4001|http://resume-service:8003|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://job-service:4002|http://job-service:8004|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://auto-apply-service:4003|http://auto-apply-service:8005|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://analytics-service:3007|http://analytics-service:8006|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://notification-service:4005|http://notification-service:8007|g' "$K8S_DIR/orchestrator-service.yaml"
sed -i 's|http://ai-service:5000|http://ai-service:8008|g' "$K8S_DIR/orchestrator-service.yaml"

echo "  ✓ Kubernetes manifests updated"
echo ""

# =============================================================================
# PART 3: Fix CORS/Domain Configuration
# =============================================================================
echo "PART 3: Fixing CORS and domain configuration..."
echo "------------------------------------------------"

# Kubernetes base configmap
echo "  - kubernetes/base/configmap.yaml"
sed -i 's/noreply@jobpilot.com/noreply@applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/base/configmap.yaml"
sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/base/configmap.yaml"

# Kubernetes production overlay
echo "  - kubernetes/overlays/production/kustomization.yaml"
sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/overlays/production/kustomization.yaml"

# Kubernetes staging overlay
echo "  - kubernetes/overlays/staging/kustomization.yaml"
sed -i 's/staging.jobpilot.com/staging.applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/overlays/staging/kustomization.yaml"
sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/overlays/staging/kustomization.yaml"

# SSL certificates
echo "  - api-gateway/overlays/production/ssl-certificates.yaml"
if [ -f "$PROJECT_ROOT/infrastructure/kubernetes/api-gateway/overlays/production/ssl-certificates.yaml" ]; then
  sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/infrastructure/kubernetes/api-gateway/overlays/production/ssl-certificates.yaml"
fi

# Environment files
echo "  - .env.example"
sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/.env.example"
sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/.env.example"

echo "  - .env.monitoring.example"
if [ -f "$PROJECT_ROOT/.env.monitoring.example" ]; then
  sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/.env.monitoring.example"
fi

echo "  - services/auth-service/.env.example"
if [ -f "$PROJECT_ROOT/services/auth-service/.env.example" ]; then
  sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/services/auth-service/.env.example"
fi

echo "  - docker-compose.yml"
sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/docker-compose.yml"

# Application code
echo "  - services/auth-service/src/config/configuration.ts"
if [ -f "$PROJECT_ROOT/services/auth-service/src/config/configuration.ts" ]; then
  sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/services/auth-service/src/config/configuration.ts"
fi

echo "  - packages/security/src/compliance/gdpr.ts"
if [ -f "$PROJECT_ROOT/packages/security/src/compliance/gdpr.ts" ]; then
  sed -i 's/jobpilot.ai/applyforus.com/g' "$PROJECT_ROOT/packages/security/src/compliance/gdpr.ts"
fi

echo "  - security-scan-config.yaml"
if [ -f "$PROJECT_ROOT/security-scan-config.yaml" ]; then
  sed -i 's/jobpilot.com/applyforus.com/g' "$PROJECT_ROOT/security-scan-config.yaml"
fi

echo "  ✓ CORS and domain configuration updated"
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "========================================"
echo "FIX COMPLETE!"
echo "========================================"
echo ""
echo "Changes made:"
echo "  ✓ 10 Dockerfiles - ports updated"
echo "  ✓ 9 K8s manifests - ports updated"
echo "  ✓ 11+ config files - domain updated"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Run tests: pnpm test"
echo "  3. Build containers: docker-compose build"
echo "  4. Commit changes: git add -A && git commit -m 'fix: Port alignment and domain rebrand'"
echo ""
