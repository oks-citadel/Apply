#!/bin/bash

# Update Kubernetes service manifests to standardized ports
K8S_SERVICES_DIR="infrastructure/kubernetes/services"

echo "Updating Kubernetes service manifests..."

# Auth service (8001 -> 8081)
sed -i 's/containerPort: 8001/containerPort: 8081/g' ${K8S_SERVICES_DIR}/auth-service.yaml
sed -i 's/port: 8001/port: 8081/g' ${K8S_SERVICES_DIR}/auth-service.yaml
sed -i 's/targetPort: 8001/targetPort: 8081/g' ${K8S_SERVICES_DIR}/auth-service.yaml
sed -i 's/prometheus.io\/port: "8001"/prometheus.io\/port: "8081"/g' ${K8S_SERVICES_DIR}/auth-service.yaml
sed -i 's/value: "8001"/value: "8081"/g' ${K8S_SERVICES_DIR}/auth-service.yaml

# User service (8002 -> 8082)
sed -i 's/containerPort: 8002/containerPort: 8082/g' ${K8S_SERVICES_DIR}/user-service.yaml
sed -i 's/port: 8002/port: 8082/g' ${K8S_SERVICES_DIR}/user-service.yaml
sed -i 's/targetPort: 8002/targetPort: 8082/g' ${K8S_SERVICES_DIR}/user-service.yaml
sed -i 's/prometheus.io\/port: "8002"/prometheus.io\/port: "8082"/g' ${K8S_SERVICES_DIR}/user-service.yaml
sed -i 's/value: "8002"/value: "8082"/g' ${K8S_SERVICES_DIR}/user-service.yaml

# Resume service (8003 -> 8083)
sed -i 's/containerPort: 8003/containerPort: 8083/g' ${K8S_SERVICES_DIR}/resume-service.yaml
sed -i 's/port: 8003/port: 8083/g' ${K8S_SERVICES_DIR}/resume-service.yaml
sed -i 's/targetPort: 8003/targetPort: 8083/g' ${K8S_SERVICES_DIR}/resume-service.yaml
sed -i 's/prometheus.io\/port: "8003"/prometheus.io\/port: "8083"/g' ${K8S_SERVICES_DIR}/resume-service.yaml
sed -i 's/value: "8003"/value: "8083"/g' ${K8S_SERVICES_DIR}/resume-service.yaml

# Job service (8004 -> 8084)
sed -i 's/containerPort: 8004/containerPort: 8084/g' ${K8S_SERVICES_DIR}/job-service.yaml
sed -i 's/port: 8004/port: 8084/g' ${K8S_SERVICES_DIR}/job-service.yaml
sed -i 's/targetPort: 8004/targetPort: 8084/g' ${K8S_SERVICES_DIR}/job-service.yaml
sed -i 's/prometheus.io\/port: "8004"/prometheus.io\/port: "8084"/g' ${K8S_SERVICES_DIR}/job-service.yaml
sed -i 's/value: "8004"/value: "8084"/g' ${K8S_SERVICES_DIR}/job-service.yaml

# Auto-apply service (8005 -> 8085)
sed -i 's/containerPort: 8005/containerPort: 8085/g' ${K8S_SERVICES_DIR}/auto-apply-service.yaml
sed -i 's/port: 8005/port: 8085/g' ${K8S_SERVICES_DIR}/auto-apply-service.yaml
sed -i 's/targetPort: 8005/targetPort: 8085/g' ${K8S_SERVICES_DIR}/auto-apply-service.yaml
sed -i 's/prometheus.io\/port: "8005"/prometheus.io\/port: "8085"/g' ${K8S_SERVICES_DIR}/auto-apply-service.yaml
sed -i 's/value: "8005"/value: "8085"/g' ${K8S_SERVICES_DIR}/auto-apply-service.yaml

# Analytics service (8006 -> 8086)
sed -i 's/containerPort: 8006/containerPort: 8086/g' ${K8S_SERVICES_DIR}/analytics-service.yaml
sed -i 's/port: 8006/port: 8086/g' ${K8S_SERVICES_DIR}/analytics-service.yaml
sed -i 's/targetPort: 8006/targetPort: 8086/g' ${K8S_SERVICES_DIR}/analytics-service.yaml
sed -i 's/prometheus.io\/port: "8006"/prometheus.io\/port: "8086"/g' ${K8S_SERVICES_DIR}/analytics-service.yaml
sed -i 's/value: "8006"/value: "8086"/g' ${K8S_SERVICES_DIR}/analytics-service.yaml

# Notification service (8007 -> 8087)
sed -i 's/containerPort: 8007/containerPort: 8087/g' ${K8S_SERVICES_DIR}/notification-service.yaml
sed -i 's/port: 8007/port: 8087/g' ${K8S_SERVICES_DIR}/notification-service.yaml
sed -i 's/targetPort: 8007/targetPort: 8087/g' ${K8S_SERVICES_DIR}/notification-service.yaml
sed -i 's/prometheus.io\/port: "8007"/prometheus.io\/port: "8087"/g' ${K8S_SERVICES_DIR}/notification-service.yaml
sed -i 's/value: "8007"/value: "8087"/g' ${K8S_SERVICES_DIR}/notification-service.yaml

# Payment service (8009 -> 8088)
sed -i 's/containerPort: 8009/containerPort: 8088/g' ${K8S_SERVICES_DIR}/payment-service.yaml
sed -i 's/port: 8009/port: 8088/g' ${K8S_SERVICES_DIR}/payment-service.yaml
sed -i 's/targetPort: 8009/targetPort: 8088/g' ${K8S_SERVICES_DIR}/payment-service.yaml
sed -i 's/prometheus.io\/port: "8009"/prometheus.io\/port: "8088"/g' ${K8S_SERVICES_DIR}/payment-service.yaml
sed -i 's/value: "8009"/value: "8088"/g' ${K8S_SERVICES_DIR}/payment-service.yaml

# AI service (8008 -> 8089)
sed -i 's/containerPort: 8008/containerPort: 8089/g' ${K8S_SERVICES_DIR}/ai-service.yaml
sed -i 's/port: 8008/port: 8089/g' ${K8S_SERVICES_DIR}/ai-service.yaml
sed -i 's/targetPort: 8008/targetPort: 8089/g' ${K8S_SERVICES_DIR}/ai-service.yaml
sed -i 's/prometheus.io\/port: "8008"/prometheus.io\/port: "8089"/g' ${K8S_SERVICES_DIR}/ai-service.yaml
sed -i 's/value: "8008"/value: "8089"/g' ${K8S_SERVICES_DIR}/ai-service.yaml

# Orchestrator service (8010 -> 8090)
sed -i 's/containerPort: 8010/containerPort: 8090/g' ${K8S_SERVICES_DIR}/orchestrator-service.yaml
sed -i 's/port: 8010/port: 8090/g' ${K8S_SERVICES_DIR}/orchestrator-service.yaml
sed -i 's/targetPort: 8010/targetPort: 8090/g' ${K8S_SERVICES_DIR}/orchestrator-service.yaml
sed -i 's/prometheus.io\/port: "8010"/prometheus.io\/port: "8090"/g' ${K8S_SERVICES_DIR}/orchestrator-service.yaml
sed -i 's/value: "8010"/value: "8090"/g' ${K8S_SERVICES_DIR}/orchestrator-service.yaml

echo "Kubernetes service manifests updated successfully!"
