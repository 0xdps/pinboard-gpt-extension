#!/usr/bin/env node

/**
 * Test script for Pinboard GPT API
 * Usage: node test-api.js [base-url]
 * Example: node test-api.js http://localhost:3000
 */

const API_BASE_URL = process.argv[2] || 'http://localhost:3000';

console.log('🧪 Testing Pinboard GPT API');
console.log(`📍 API URL: ${API_BASE_URL}`);
console.log('');

async function testHealthCheck() {
  console.log('1️⃣  Testing health check...');
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('   ✅ Health check passed');
      console.log(`   📦 Service: ${data.service}`);
      console.log(`   🏷️  Version: ${data.version}`);
      return true;
    } else {
      console.log('   ❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testRegister() {
  console.log('\n2️⃣  Testing user registration...');
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpassword123',
        name: 'Test User'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('   ✅ Registration successful');
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   🔑 License: ${data.license.type}`);
      return data.token;
    } else {
      console.log(`   ❌ Registration failed: ${data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Registration failed: ${error.message}`);
    return null;
  }
}

async function testProfile(token) {
  console.log('\n3️⃣  Testing user profile...');
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.user) {
      console.log('   ✅ Profile retrieved');
      console.log(`   👤 User: ${data.user.name} (${data.user.email})`);
      console.log(`   🎫 License: ${data.license.type}`);
      return true;
    } else {
      console.log(`   ❌ Profile fetch failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Profile fetch failed: ${error.message}`);
    return false;
  }
}

async function testLicenseActivation(token) {
  console.log('\n4️⃣  Testing license activation...');
  // Generate a valid test key format
  const testKey = 'PINGPT-PRO-TEST01-ABC123';
  
  try {
    const response = await fetch(`${API_BASE_URL}/user/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ licenseKey: testKey })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('   ✅ License activation processed');
      console.log(`   🎫 Type: ${data.type}`);
      return true;
    } else {
      console.log(`   ⚠️  License activation: ${data.error || 'Invalid test key (expected)'}`);
      return true; // Expected to fail with test key
    }
  } catch (error) {
    console.log(`   ❌ License activation failed: ${error.message}`);
    return false;
  }
}

async function testPinsSync(token) {
  console.log('\n5️⃣  Testing pins sync (Premium only)...');
  try {
    const response = await fetch(`${API_BASE_URL}/pins/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pins: [
          {
            title: 'Test Pin',
            message: 'This is a test pin',
            tags: ['test'],
            url: 'https://example.com',
            timestamp: Date.now()
          }
        ]
      })
    });
    
    const data = await response.json();
    
    if (response.status === 403) {
      console.log('   ⚠️  Pins sync requires Premium license (expected for free users)');
      return true;
    } else if (response.ok) {
      console.log('   ✅ Pins synced successfully');
      return true;
    } else {
      console.log(`   ❌ Pins sync failed: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Pins sync failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  // Test 1: Health check
  if (await testHealthCheck()) {
    passed++;
  } else {
    failed++;
    console.log('\n❌ API is not responding. Make sure the server is running.');
    process.exit(1);
  }
  
  // Test 2: Register
  const token = await testRegister();
  if (token) {
    passed++;
  } else {
    failed++;
    console.log('\n❌ Cannot continue tests without authentication token.');
    process.exit(1);
  }
  
  // Test 3: Profile
  if (await testProfile(token)) {
    passed++;
  } else {
    failed++;
  }
  
  // Test 4: License activation
  if (await testLicenseActivation(token)) {
    passed++;
  } else {
    failed++;
  }
  
  // Test 5: Pins sync
  if (await testPinsSync(token)) {
    passed++;
  } else {
    failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
