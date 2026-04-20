#!/bin/bash

# Login and get token
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bhanvadiyaneel31@gmail.com", "password": "password123"}')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  echo $RESPONSE
  exit 1
fi

echo "Logged in, token received."

# Reschedule appointment 17
echo "Attempting to reschedule appointment 17 to 2026-04-22 11:00..."
curl -v -X PATCH http://localhost:5001/api/appointments/17/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"newDate": "2026-04-22", "newTime": "11:00"}'
