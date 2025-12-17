#!/bin/bash
# Deploy ApplyForUs Monitoring Stack
# This script deploys Prometheus, Grafana, and Alertmanager to the monitoring namespace

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="monitoring"

echo "=========================================="
echo "ApplyForUs Monitoring Stack Deployment"
echo "=========================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check cluster connectivity
echo "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "Cluster connection verified."

# Create monitoring namespace if it doesn't exist
echo ""
echo "Creating monitoring namespace..."
kubectl apply -f "${SCRIPT_DIR}/namespace.yaml"

# Wait for namespace to be ready
kubectl wait --for=condition=Active namespace/${NAMESPACE} --timeout=30s

# Deploy Prometheus ConfigMaps
echo ""
echo "Deploying Prometheus configuration..."
kubectl apply -f "${SCRIPT_DIR}/prometheus-configmap.yaml"
kubectl apply -f "${SCRIPT_DIR}/prometheus-rules.yaml"

# Deploy Prometheus
echo ""
echo "Deploying Prometheus..."
kubectl apply -f "${SCRIPT_DIR}/prometheus-deployment.yaml"

# Wait for Prometheus to be ready
echo "Waiting for Prometheus to be ready..."
kubectl -n ${NAMESPACE} rollout status deployment/prometheus --timeout=300s

# Deploy Alertmanager
echo ""
echo "Deploying Alertmanager..."
kubectl apply -f "${SCRIPT_DIR}/alertmanager-deployment.yaml"

# Wait for Alertmanager to be ready
echo "Waiting for Alertmanager to be ready..."
kubectl -n ${NAMESPACE} rollout status deployment/alertmanager --timeout=120s

# Deploy Grafana
echo ""
echo "Deploying Grafana dashboards..."
kubectl apply -f "${SCRIPT_DIR}/grafana-dashboards.yaml"

echo ""
echo "Deploying Grafana..."
kubectl apply -f "${SCRIPT_DIR}/grafana-deployment.yaml"

# Wait for Grafana to be ready
echo "Waiting for Grafana to be ready..."
kubectl -n ${NAMESPACE} rollout status deployment/grafana --timeout=180s

# Verify deployments
echo ""
echo "=========================================="
echo "Deployment Status"
echo "=========================================="

echo ""
echo "Pods in ${NAMESPACE} namespace:"
kubectl get pods -n ${NAMESPACE}

echo ""
echo "Services in ${NAMESPACE} namespace:"
kubectl get services -n ${NAMESPACE}

echo ""
echo "=========================================="
echo "Access Information"
echo "=========================================="

echo ""
echo "To access Prometheus locally:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/prometheus 9090:9090"
echo "  Open: http://localhost:9090"

echo ""
echo "To access Grafana locally:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/grafana 3000:3000"
echo "  Open: http://localhost:3000"
echo "  Default credentials: admin / (check grafana-secrets)"

echo ""
echo "To access Alertmanager locally:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/alertmanager 9093:9093"
echo "  Open: http://localhost:9093"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="

# Additional notes
echo ""
echo "IMPORTANT: Update the following secrets in production:"
echo "  1. grafana-secrets (admin password)"
echo "  2. alertmanager-secrets (PagerDuty key, Slack webhook)"
echo ""
echo "Prometheus is configured to scrape pods with the following annotations:"
echo "  prometheus.io/scrape: 'true'"
echo "  prometheus.io/port: '<port>'"
echo "  prometheus.io/path: '/metrics'"
