#!/bin/bash
API="http://localhost:5001/api"
EMAIL="qa_$(date +%s)@example.com"
PASSWORD="password123"

echo "--- 1. Testing Registration ---"
REG_RES=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"QA Tester\", \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
echo $REG_RES | grep -q "user" && echo "PASS: Registration successful" || echo "FAIL: Registration failed ($REG_RES)"

echo -e "\n--- 2. Testing Login ---"
LOG_RES=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
TOKEN=$(echo $LOG_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$TOKEN" ]; then
  echo "PASS: Login successful, token received."
else
  echo "FAIL: Login failed ($LOG_RES)"
fi

echo -e "\n--- 3. Testing Invalid Login ---"
INV_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"wrongpass\"}")
if [ "$INV_RES" == "401" ]; then
  echo "PASS: Invalid login rejected with 401."
else
  echo "FAIL: Invalid login returned $INV_RES instead of 401."
fi
