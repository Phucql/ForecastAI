import fetch from 'node-fetch';

const BASE_URL = 'https://forecastai-ii8z.onrender.com';

// Simple cookie jar for testing
let cookieJar = '';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  // Test 1: Check current users
  console.log('1. Checking current users...');
  try {
    const usersRes = await fetch(`${BASE_URL}/api/debug/users`);
    const usersData = await usersRes.json();
    console.log('Current users:', usersData);
  } catch (error) {
    console.log('Error checking users:', error.message);
  }

  // Test 2: Try to signup a new user with different credentials
  console.log('\n2. Testing signup with new credentials...');
  try {
    const signupRes = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'testpass123',
        username: 'testuser2'
      }),
    });
    
    console.log('Signup status:', signupRes.status);
    const signupData = await signupRes.json();
    console.log('Signup response:', signupData);
    
    // Extract cookies from response
    const setCookieHeader = signupRes.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('🍪 Set-Cookie header:', setCookieHeader);
      cookieJar = setCookieHeader;
    }
    
    if (signupRes.ok) {
      console.log('✅ Signup successful!');
    } else {
      console.log('❌ Signup failed!');
    }
  } catch (error) {
    console.log('Signup error:', error.message);
  }

  // Test 3: Try to login
  console.log('\n3. Testing login...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieJar // Include cookies from previous request
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'testpass123'
      }),
    });
    
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
    
    // Extract cookies from response
    const setCookieHeader = loginRes.headers.get('set-cookie');
    if (setCookieHeader) {
      console.log('🍪 Set-Cookie header from login:', setCookieHeader);
      cookieJar = setCookieHeader;
    }
    
    if (loginRes.ok) {
      console.log('✅ Login successful!');
      
      // Test 4: Try to access /api/me with cookies
      console.log('\n4. Testing /api/me endpoint...');
      try {
        const meRes = await fetch(`${BASE_URL}/api/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieJar // Include cookies
          },
          credentials: 'include'
        });
        
        console.log('/api/me status:', meRes.status);
        if (meRes.ok) {
          const meData = await meRes.json();
          console.log('/api/me response:', meData);
          console.log('✅ /api/me successful!');
        } else {
          const meError = await meRes.json();
          console.log('/api/me error:', meError);
          console.log('❌ /api/me failed!');
        }
      } catch (error) {
        console.log('/api/me error:', error.message);
      }
    } else {
      console.log('❌ Login failed!');
    }
  } catch (error) {
    console.log('Login error:', error.message);
  }

  // Test 5: Check users again
  console.log('\n5. Checking users after signup...');
  try {
    const usersRes2 = await fetch(`${BASE_URL}/api/debug/users`);
    const usersData2 = await usersRes2.json();
    console.log('Users after signup:', usersData2);
  } catch (error) {
    console.log('Error checking users:', error.message);
  }

  // Test 6: Try a direct test with the existing user
  console.log('\n6. Testing with existing user...');
  try {
    const loginRes2 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123'
      }),
    });
    
    console.log('Login status (existing user):', loginRes2.status);
    const loginData2 = await loginRes2.json();
    console.log('Login response (existing user):', loginData2);
    
    // Extract cookies from response
    const setCookieHeader2 = loginRes2.headers.get('set-cookie');
    if (setCookieHeader2) {
      console.log('🍪 Set-Cookie header from login (existing):', setCookieHeader2);
      cookieJar = setCookieHeader2;
    }
    
    if (loginRes2.ok) {
      // Try /api/me immediately after login
      const meRes2 = await fetch(`${BASE_URL}/api/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieJar
        },
        credentials: 'include'
      });
      
      console.log('/api/me status (immediate):', meRes2.status);
      if (meRes2.ok) {
        const meData2 = await meRes2.json();
        console.log('/api/me response (immediate):', meData2);
        console.log('✅ /api/me successful (immediate)!');
      } else {
        const meError2 = await meRes2.json();
        console.log('/api/me error (immediate):', meError2);
        console.log('❌ /api/me failed (immediate)!');
      }
    }
  } catch (error) {
    console.log('Test with existing user error:', error.message);
  }
}

testAuth().catch(console.error); 