#!/bin/bash

# Update docker-compose.test.yml to use standardized ports
echo "Updating docker-compose.test.yml..."

# Auth service (3001 -> 8081)
sed -i "s/'3001:3001'/'8081:8081'/g" docker-compose.test.yml
sed -i "s/PORT: 3001/PORT: 8081/g" docker-compose.test.yml
sed -i "s|http://localhost:3001|http://localhost:8081|g" docker-compose.test.yml
sed -i "s|http://auth-service-test:3001|http://auth-service-test:8081|g" docker-compose.test.yml

# Analytics/Auto-apply service (3007 -> 8086)
sed -i "s/'3007:3007'/'8086:8086'/g" docker-compose.test.yml
sed -i "s/PORT: 3007/PORT: 8086/g" docker-compose.test.yml
sed -i "s|http://localhost:3007|http://localhost:8086|g" docker-compose.test.yml

echo "Test docker-compose file updated successfully!"
