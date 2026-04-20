#!/bin/bash
API="http://localhost:5001/api"
# Get a token
AUTH=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "bhanvadiyaneel31@gmail.com", "password": "password123"}')
TOKEN=$(echo $AUTH | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create an appointment to reschedule
BOOK=$(curl -s -X POST $API/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-08-01", "appointment_time": "10:00"}')
ID=$(echo $BOOK | grep -o '"id":[0-9]*' | cut -d':' -f2)

echo "--- 1. Valid Reschedule ---"
RESCHED_RES=$(curl -s -X PATCH $API/appointments/$ID/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"newDate": "2026-08-01", "newTime": "12:00"}')
echo $RESCHED_RES | grep -q "12:00" && echo "PASS: Reschedule successful" || echo "FAIL: Reschedule failed ($RESCHED_RES)"

echo -e "\n--- 2. Reschedule Overlap ---"
# Create another appointment at 14:00
curl -s -X POST $API/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-08-01", "appointment_time": "14:00"}' > /dev/null
# Try to reschedule first one to 14:00
OVERLAP_RES=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $API/appointments/$ID/reschedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"newDate": "2026-08-01", "newTime": "14:00"}')
if [ "$OVERLAP_RES" == "409" ]; then echo "PASS: Reschedule overlap rejected"; else echo "FAIL: Overlap returned $OVERLAP_RES"; fi
