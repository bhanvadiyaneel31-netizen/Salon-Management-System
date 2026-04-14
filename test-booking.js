const fetch = require('node-fetch');

async function testBooking() {
  // 1. login as customer
  let res = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'customer@example.com', password: 'password123'})
  });
  let data = await res.json();
  const token = data.token;
  
  console.log("Token:", token.substring(0, 20) + "...");

  // 2. try to book an appointment
  // service_id: 1 (Hair Cut & Style), staff_id: 4 (Emma Wilson)
  let bookRes = await fetch('http://localhost:5001/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      service_id: 1,
      staff_id: 4,
      appointment_date: '2026-04-15',
      appointment_time: '10:00',
      notes: ''
    })
  });
  
  if (!bookRes.ok) {
     const error = await bookRes.json();
     console.error("Booking failed:", error);
  } else {
     const booking = await bookRes.json();
     console.log("Booking successful! ID:", booking.id);
  }
}

testBooking().catch(console.error);
