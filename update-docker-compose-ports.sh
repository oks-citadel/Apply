#!/bin/bash

# Update docker-compose.prod.yml
echo "Updating docker-compose.prod.yml..."
sed -i "s/'4000:4000'/'8081:8081'/g" docker-compose.prod.yml
sed -i "s/PORT: 4000/PORT: 8081/g" docker-compose.prod.yml
sed -i "s|http://localhost:4000/health|http://localhost:8081/health|g" docker-compose.prod.yml

sed -i "s/'5000:5000'/'8089:8089'/g" docker-compose.prod.yml
sed -i "s/PORT: 5000/PORT: 8089/g" docker-compose.prod.yml
sed -i "s|http://localhost:5000/health|http://localhost:8089/health|g" docker-compose.prod.yml

# Update docker-compose.local.yml
echo "Updating docker-compose.local.yml..."
# Auth service (4000 -> 8081)
sed -i "s/'4000:4000'/'8081:8081'/g" docker-compose.local.yml
sed -i "s/PORT: 4000/PORT: 8081/g" docker-compose.local.yml
sed -i "s|NEXT_PUBLIC_API_URL: http://localhost:4000|NEXT_PUBLIC_API_URL: http://localhost:8081|g" docker-compose.local.yml

# Resume service (4001 -> 8083)
sed -i "s/'4001:4001'/'8083:8083'/g" docker-compose.local.yml
sed -i "s/PORT: 4001/PORT: 8083/g" docker-compose.local.yml
sed -i "s|http://resume-service:4001|http://resume-service:8083|g" docker-compose.local.yml

# Job service (4002 -> 8084)
sed -i "s/'4002:4002'/'8084:8084'/g" docker-compose.local.yml
sed -i "s/PORT: 4002/PORT: 8084/g" docker-compose.local.yml
sed -i "s|http://job-service:4002|http://job-service:8084|g" docker-compose.local.yml

# Auto-apply service (4003 -> 8085)
sed -i "s/'4003:4003'/'8085:8085'/g" docker-compose.local.yml
sed -i "s/PORT: 4003/PORT: 8085/g" docker-compose.local.yml

# User service (4004 -> 8082)
sed -i "s/'4004:4004'/'8082:8082'/g" docker-compose.local.yml
sed -i "s/PORT: 4004/PORT: 8082/g" docker-compose.local.yml

# Notification service (4005 -> 8087)
sed -i "s/'4005:4005'/'8087:8087'/g" docker-compose.local.yml
sed -i "s/PORT: 4005/PORT: 8087/g" docker-compose.local.yml

# AI service (5000 -> 8089)
sed -i "s/'5000:5000'/'8089:8089'/g" docker-compose.local.yml
sed -i "s/PORT: 5000/PORT: 8089/g" docker-compose.local.yml
sed -i "s|NEXT_PUBLIC_AI_SERVICE_URL: http://localhost:5000|NEXT_PUBLIC_AI_SERVICE_URL: http://localhost:8089|g" docker-compose.local.yml
sed -i "s|http://ai-service:5000|http://ai-service:8089|g" docker-compose.local.yml

echo "Docker Compose files updated successfully!"
