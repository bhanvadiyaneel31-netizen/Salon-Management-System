const fetch = require('node-fetch');

async function testAuth() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  console.log('--- 1. Registering new customer ---');
  const regRes = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'QA Tester', email, password, phone: '1234567890' })
  });
  const regData = await regRes.json();
  console.log('Reg Result:', regRes.status, regData.user ? 'SUCCESS' : 'FAIL');

  console.log('--- 2. Logging in ---');
  const logRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const logData = await logRes.json();
  console.log('Login Result:', logRes.status, logData.token ? 'TOKEN RECEIVED' : 'FAIL');

  console.log('--- 3. Invalid Login ---');
  const invRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrongpassword' })
  });
  console.log('Invalid Login Result:', invRes.status, invRes.status === 401 ? 'REJECTED (OK)' : 'FAIL');
}

testAuth();
