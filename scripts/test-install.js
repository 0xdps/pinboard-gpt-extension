/**
 * Test the install endpoint with different user agents
 */

const userAgents = {
  chrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  brave: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  unknown: 'SomeRandomBot/1.0'
};

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(browser, userAgent) {
  console.log(`\n🧪 Testing ${browser}:`);
  console.log(`   User-Agent: ${userAgent.substring(0, 60)}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/install`, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent
      },
      redirect: 'manual' // Don't follow redirects
    });
    
    const location = response.headers.get('location');
    const status = response.status;
    
    console.log(`   Status: ${status}`);
    console.log(`   Redirect: ${location}`);
    
    // Validate redirect
    if (status === 302 || status === 301) {
      console.log(`   ✅ Redirect successful`);
    } else {
      console.log(`   ❌ Expected 302, got ${status}`);
    }
    
    return { browser, status, location };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { browser, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing /api/install endpoint');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  const results = [];
  
  for (const [browser, userAgent] of Object.entries(userAgents)) {
    const result = await testEndpoint(browser, userAgent);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  console.log('─'.repeat(80));
  results.forEach(({ browser, status, location, error }) => {
    if (error) {
      console.log(`${browser.padEnd(10)} | ERROR: ${error}`);
    } else {
      console.log(`${browser.padEnd(10)} | ${status} → ${location}`);
    }
  });
  
  console.log('\n💡 Next steps:');
  console.log('   1. Update Chrome Web Store URL in api/install.js');
  console.log('   2. Update Firefox Add-ons URL in api/install.js');
  console.log('   3. Deploy: npm run deploy');
  console.log('   4. Test live: TEST_URL=https://gptpins.dps.codes npm run install:test');
}

runTests();
