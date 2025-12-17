#!/bin/bash

# Notification Service API Test Script
# Usage: ./test-notifications.sh [BASE_URL]

BASE_URL="${1:-http://localhost:8007}"
USER_ID="test-user-$(date +%s)"

echo "================================"
echo "Notification Service API Tests"
echo "================================"
echo "Base URL: $BASE_URL"
echo "Test User ID: $USER_ID"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Create notification
echo -e "${BLUE}Test 2: Create Notification${NC}"
NOTIFICATION_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"IN_APP\",
    \"title\": \"Welcome!\",
    \"message\": \"Welcome to the Job Application Platform\",
    \"category\": \"welcome\"
  }")
echo "$NOTIFICATION_RESPONSE" | jq '.'
NOTIFICATION_ID=$(echo "$NOTIFICATION_RESPONSE" | jq -r '.id')
echo ""

# Test 3: Get user preferences
echo -e "${BLUE}Test 3: Get User Preferences${NC}"
curl -s "$BASE_URL/notifications/preferences/$USER_ID" | jq '.'
echo ""

# Test 4: Update preferences
echo -e "${BLUE}Test 4: Update Preferences${NC}"
curl -s -X PUT "$BASE_URL/notifications/preferences/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "pushEnabled": true,
    "emailApplicationStatus": true
  }' | jq '.'
echo ""

# Test 5: Get notifications
echo -e "${BLUE}Test 5: Get Notifications${NC}"
curl -s "$BASE_URL/notifications?userId=$USER_ID" | jq '.'
echo ""

# Test 6: Get unread count
echo -e "${BLUE}Test 6: Get Unread Count${NC}"
curl -s "$BASE_URL/notifications/user/$USER_ID/unread-count" | jq '.'
echo ""

# Test 7: Mark as read
if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
  echo -e "${BLUE}Test 7: Mark Notification as Read${NC}"
  curl -s -X PATCH "$BASE_URL/notifications/$NOTIFICATION_ID/read" | jq '.'
  echo ""
fi

# Test 8: Register device
echo -e "${BLUE}Test 8: Register Device for Push Notifications${NC}"
curl -s -X POST "$BASE_URL/push/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"token\": \"test-fcm-token-${USER_ID}\",
    \"platform\": \"web\",
    \"deviceName\": \"Test Browser\",
    \"appVersion\": \"1.0.0\"
  }" | jq '.'
echo ""

# Test 9: Get user devices
echo -e "${BLUE}Test 9: Get User Devices${NC}"
curl -s "$BASE_URL/push/devices/$USER_ID" | jq '.'
echo ""

# Test 10: Create another notification
echo -e "${BLUE}Test 10: Create Application Status Notification${NC}"
curl -s -X POST "$BASE_URL/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"IN_APP\",
    \"title\": \"Application Update\",
    \"message\": \"Your application for Senior Developer at TechCorp has been reviewed\",
    \"category\": \"application\",
    \"data\": {
      \"jobId\": \"job-123\",
      \"company\": \"TechCorp\",
      \"status\": \"reviewing\"
    }
  }" | jq '.'
echo ""

# Test 11: Mark all as read
echo -e "${BLUE}Test 11: Mark All as Read${NC}"
curl -s -X PATCH "$BASE_URL/notifications/user/$USER_ID/read-all" | jq '.'
echo ""

# Test 12: Send push notification
echo -e "${BLUE}Test 12: Send Push Notification${NC}"
curl -s -X POST "$BASE_URL/notifications/push" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"title\": \"New Job Match\",
    \"message\": \"5 new jobs match your preferences\",
    \"icon\": \"/logo.png\",
    \"data\": {
      \"action\": \"view_jobs\",
      \"count\": 5
    }
  }" | jq '.'
echo ""

# Test 13: Get final notification list
echo -e "${BLUE}Test 13: Get Final Notification List${NC}"
curl -s "$BASE_URL/notifications/user/$USER_ID?limit=10" | jq '.'
echo ""

# Test 14: Clean up - Delete notification
if [ ! -z "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
  echo -e "${BLUE}Test 14: Delete Notification${NC}"
  curl -s -X DELETE "$BASE_URL/notifications/$NOTIFICATION_ID"
  echo "Notification deleted"
  echo ""
fi

# Test 15: Unregister device
echo -e "${BLUE}Test 15: Unregister Device${NC}"
curl -s -X DELETE "$BASE_URL/push/unregister" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"token\": \"test-fcm-token-${USER_ID}\"
  }" | jq '.'
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${GREEN}================================${NC}"
