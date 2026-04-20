const fetch = require('node-fetch');

async function testReschedule() {
  const loginRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bhanvadiyaneel31@gmail.com', password: 'password123' })
  });
  
  const { token } = await loginRes.json();
  console.log('Logged in, token received');

  const rescheduleRes = await fetch('http://localhost:5001/api/appointments/17/reschedule', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ newDate: '2026-04-22', newTime: '11:00' })
  });

  const result = await rescheduleRes.json();
  console.log('Reschedule Result:', JSON.stringify(result, null, 2));
}

testReschedule();
