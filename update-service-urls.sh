#!/bin/bash

# Update hardcoded service URLs in orchestrator-service agent-client.service.ts
echo "Updating orchestrator-service default URLs..."

AGENT_CLIENT_FILE="services/orchestrator-service/src/orchestrator/services/agent-client.service.ts"

# Update service URLs to use new ports (these are fallback defaults)
sed -i "s|http://job-service:3003|http://job-service:8084|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://ai-service:3004|http://ai-service:8089|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://auto-apply-service:3008|http://auto-apply-service:8085|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://auth-service:3001|http://auth-service:8081|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://user-service:3002|http://user-service:8082|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://analytics-service:3006|http://analytics-service:8086|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://notification-service:3007|http://notification-service:8087|g" ${AGENT_CLIENT_FILE}
sed -i "s|http://resume-service:3005|http://resume-service:8083|g" ${AGENT_CLIENT_FILE}

echo "Orchestrator service URLs updated successfully!"
