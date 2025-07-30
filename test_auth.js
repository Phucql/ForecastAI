const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');

  // Test signup
  console.log('1. Testing signup...');
  try {
    const signupResponse = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      })
    });

    const signupData = await signupResponse.json();
    console.log('Signup response:', signupResponse.status, signupData);

    if (signupResponse.ok) {
      console.log('✅ Signup successful');
      
      // Test login
      console.log('\n2. Testing login...');
      const loginResponse = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginResponse.status, loginData);

      if (loginResponse.ok) {
        console.log('✅ Login successful');
        
        // Get cookies for authenticated request
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Cookies received:', cookies ? 'Yes' : 'No');
        
        // Test /api/me endpoint
        console.log('\n3. Testing /api/me...');
        const meResponse = await fetch(`${BASE_URL}/api/me`, {
          headers: {
            'Cookie': cookies
          }
        });

        const meData = await meResponse.json();
        console.log('Me response:', meResponse.status, meData);

        if (meResponse.ok) {
          console.log('✅ /api/me successful');
        } else {
          console.log('❌ /api/me failed');
        }
      } else {
        console.log('❌ Login failed');
      }
    } else {
      console.log('❌ Signup failed');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAuth(); 