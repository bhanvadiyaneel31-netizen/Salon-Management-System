#!/bin/bash
API="http://localhost:5001/api"
# Get a token
AUTH=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "bhanvadiyaneel31@gmail.com", "password": "password123"}')
TOKEN=$(echo $AUTH | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "--- 1. Valid Booking (Future) ---"
BOOK_RES=$(curl -s -X POST $API/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-05-01", "appointment_time": "14:00"}')
echo $BOOK_RES | grep -q "id" && echo "PASS: Valid booking successful" || echo "FAIL: Valid booking failed ($BOOK_RES)"

echo -e "\n--- 2. Past Date Booking ---"
PAST_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2020-01-01", "appointment_time": "14:00"}')
if [ "$PAST_RES" == "400" ]; then echo "PASS: Past date rejected"; else echo "FAIL: Past date returned $PAST_RES"; fi

echo -e "\n--- 3. Outside Working Hours (08:00 AM) ---"
HOURS_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-05-01", "appointment_time": "08:00"}')
if [ "$HOURS_RES" == "400" ]; then echo "PASS: Outside hours rejected"; else echo "FAIL: Outside hours returned $HOURS_RES"; fi

echo -e "\n--- 4. Overlap Test ---"
# First book a slot: 2026-06-01 11:00 (Service 1 is 60 mins)
curl -s -X POST $API/appointments -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-06-01", "appointment_time": "11:00"}' > /dev/null
# Try same slot
OVERLAP_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "staff_id": 4, "appointment_date": "2026-06-01", "appointment_time": "11:00"}')
if [ "$OVERLAP_RES" == "409" ]; then echo "PASS: Overlap rejected"; else echo "FAIL: Overlap returned $OVERLAP_RES"; fi

echo -e "\n--- 5. Staff-Service Mapping Rule ---"
# Staff 5 (Facial) trying to book Service 1 (Hair)
MAPPING_RES=$(curl -s -X POST $API/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"service_id": 1, "staff_id": 5, "appointment_date": "2026-07-01", "appointment_time": "14:00"}')
echo $MAPPING_RES | grep -q "not Hair" && echo "PASS: Incorrect staff-service mapping rejected" || echo "FAIL: Mapping not enforced ($MAPPING_RES)"
