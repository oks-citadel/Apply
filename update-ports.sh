#!/bin/bash

# Update auth-service (4000 -> 8081)
sed -i 's/ENV PORT=4000/ENV PORT=8081/g' services/auth-service/Dockerfile
sed -i 's/EXPOSE 4000/EXPOSE 8081/g' services/auth-service/Dockerfile
sed -i 's|http://localhost:4000/health|http://localhost:8081/health|g' services/auth-service/Dockerfile
sed -i "s/configService.get('PORT', 3001)/configService.get('PORT', 8081)/g" services/auth-service/src/main.ts
sed -i "s/configService.get('API_BASE_URL', 'http:\/\/localhost:3001')/configService.get('API_BASE_URL', 'http:\/\/localhost:8081')/g" services/auth-service/src/main.ts

# Update user-service (4004 -> 8082)
sed -i 's/ENV PORT=4004/ENV PORT=8082/g' services/user-service/Dockerfile
sed -i 's/EXPOSE 4004/EXPOSE 8082/g' services/user-service/Dockerfile
sed -i 's|http://localhost:4004/health|http://localhost:8082/health|g' services/user-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8082)/g" services/user-service/src/main.ts

# Update resume-service (4001 -> 8083)
sed -i 's/ENV PORT=4001/ENV PORT=8083/g' services/resume-service/Dockerfile
sed -i 's/EXPOSE 4001/EXPOSE 8083/g' services/resume-service/Dockerfile
sed -i 's|http://localhost:4001/health|http://localhost:8083/health|g' services/resume-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8083)/g" services/resume-service/src/main.ts

# Update job-service (4002 -> 8084)
sed -i 's/ENV PORT=4002/ENV PORT=8084/g' services/job-service/Dockerfile
sed -i 's/EXPOSE 4002/EXPOSE 8084/g' services/job-service/Dockerfile
sed -i 's|http://localhost:4002/health|http://localhost:8084/health|g' services/job-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8084)/g" services/job-service/src/main.ts

# Update auto-apply-service (4003 -> 8085)
sed -i 's/ENV PORT=4003/ENV PORT=8085/g' services/auto-apply-service/Dockerfile
sed -i 's/EXPOSE 4003/EXPOSE 8085/g' services/auto-apply-service/Dockerfile
sed -i 's|http://localhost:4003/health|http://localhost:8085/health|g' services/auto-apply-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8085)/g" services/auto-apply-service/src/main.ts

# Update analytics-service (3007 -> 8086)
sed -i 's/ENV PORT=3007/ENV PORT=8086/g' services/analytics-service/Dockerfile
sed -i 's/EXPOSE 3007/EXPOSE 8086/g' services/analytics-service/Dockerfile
sed -i 's|http://localhost:3007/health|http://localhost:8086/health|g' services/analytics-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8086)/g" services/analytics-service/src/main.ts

# Update notification-service (4005 -> 8087)
sed -i 's/ENV PORT=4005/ENV PORT=8087/g' services/notification-service/Dockerfile
sed -i 's/EXPOSE 4005/EXPOSE 8087/g' services/notification-service/Dockerfile
sed -i 's|http://localhost:4005/health|http://localhost:8087/health|g' services/notification-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8087)/g" services/notification-service/src/main.ts

# Update payment-service (8009 -> 8088)
sed -i 's/ENV PORT=8009/ENV PORT=8088/g' services/payment-service/Dockerfile
sed -i 's/EXPOSE 8009/EXPOSE 8088/g' services/payment-service/Dockerfile
sed -i 's|http://localhost:8009/health|http://localhost:8088/health|g' services/payment-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8088)/g" services/payment-service/src/main.ts

# Update ai-service (5000 -> 8089)
sed -i 's/PORT=5000/PORT=8089/g' services/ai-service/Dockerfile
sed -i 's/EXPOSE 5000/EXPOSE 8089/g' services/ai-service/Dockerfile
sed -i 's|http://localhost:5000/health|http://localhost:8089/health|g' services/ai-service/Dockerfile
sed -i 's/"--port", "5000"/"--port", "8089"/g' services/ai-service/Dockerfile
sed -i 's/port=5000/port=8089/g' services/ai-service/src/main.py

# Update orchestrator-service (3009 -> 8090)
sed -i 's/ENV PORT=3009/ENV PORT=8090/g' services/orchestrator-service/Dockerfile
sed -i 's/EXPOSE 3009/EXPOSE 8090/g' services/orchestrator-service/Dockerfile
sed -i 's|http://localhost:3009/health|http://localhost:8090/health|g' services/orchestrator-service/Dockerfile
sed -i "s/configService.get('PORT', [0-9]*)/configService.get('PORT', 8090)/g" services/orchestrator-service/src/main.ts

echo "Port updates completed for all services!"
