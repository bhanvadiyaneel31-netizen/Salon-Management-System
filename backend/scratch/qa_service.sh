#!/bin/bash
API="http://localhost:5001/api"
# Admin login
AUTH=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "admin@example.com", "password": "password123"}')
TOKEN=$(echo $AUTH | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "--- 1. Admin Creating Service ---"
SNAME="QA New Service $(date +%s)"
CREATE_RES=$(curl -s -X POST $API/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\": \"$SNAME\", \"description\": \"Test\", \"price\": 50, \"duration\": 30, \"category\": \"Hair\"}")
echo $CREATE_RES | grep -q "id" && echo "PASS: Service creation successful" || echo "FAIL: Service creation failed ($CREATE_RES)"

echo -e "\n--- 2. Visibility Check ---"
VIS_RES=$(curl -s $API/services?bookable=true)
echo $VIS_RES | grep -q "$SNAME" && echo "PASS: New service visible to customers" || echo "FAIL: New service not visible"
