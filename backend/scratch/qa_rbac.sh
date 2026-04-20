#!/bin/bash
API="http://localhost:5001/api"

echo "--- 1. Staff: Update Own Name ---"
S_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "lisa@salon.com", "password": "password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
curl -s -X PATCH $API/staff/profile -H "Content-Type: application/json" -H "Authorization: Bearer $S_TOKEN" -d '{"name": "Lisa Updated"}' | grep -q "Lisa Updated" && echo "PASS" || echo "FAIL"

echo -e "\n--- 2. Staff: Try Update Category (Forbidden) ---"
curl -s -X PATCH $API/staff/profile -H "Content-Type: application/json" -H "Authorization: Bearer $S_TOKEN" -d '{"category": "Hair"}' | grep -q "Primary category can only be updated by an admin" && echo "PASS" || echo "FAIL"

echo -e "\n--- 3. Admin: Update Staff Category ---"
A_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "admin@example.com", "password": "password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
curl -s -X PATCH $API/staff/5 -H "Content-Type: application/json" -H "Authorization: Bearer $A_TOKEN" -d '{"category": "Massage"}' | grep -q "Massage" && echo "PASS" || echo "FAIL"

echo -e "\n--- 4. Admin: Try Update Staff Name (Forbidden) ---"
curl -s -X PATCH $API/staff/5 -H "Content-Type: application/json" -H "Authorization: Bearer $A_TOKEN" -d '{"name": "Hacked"}' | grep -q "Admins are not allowed to update staff name" && echo "PASS" || echo "FAIL"

echo -e "\n--- 5. Customer: Try View Other Appointment ---"
C1_TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{"email": "bhanvadiyaneel31@gmail.com", "password": "password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
# Try to view appointment 1 (belongs to admin or someone else)
curl -s -o /dev/null -w "%{http_code}" -X GET $API/appointments/1 -H "Authorization: Bearer $C1_TOKEN" | grep -q "403" && echo "PASS: Access Denied" || echo "FAIL: Customer could view other appt"
