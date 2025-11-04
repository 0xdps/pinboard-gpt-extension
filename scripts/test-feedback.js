#!/usr/bin/env node

// Simple test script to validate feedback system setup
const https = require('https');

console.log('🧪 Testing GPT Pinboard Feedback System\n');

// Test 1: Check if environment variables are configured
console.log('1. Checking environment configuration...');

// This would run in Vercel environment, not locally
if (process.env.GITHUB_TOKEN) {
    console.log('✅ GITHUB_TOKEN is configured');
} else {
    console.log('❌ GITHUB_TOKEN not found in environment');
    console.log('   Run: vercel env add GITHUB_TOKEN');
}

// Test 2: Check if goodbye page is accessible
console.log('\n2. Testing goodbye page accessibility...');

const testUrl = process.argv[2] || 'https://gpt-pinboard-extension.vercel.app/goodbye.html';

https.get(testUrl, (res) => {
    if (res.statusCode === 200) {
        console.log(`✅ Goodbye page accessible: ${testUrl}`);
        console.log(`   Status: ${res.statusCode}`);
    } else {
        console.log(`❌ Goodbye page not accessible: ${testUrl}`);
        console.log(`   Status: ${res.statusCode}`);
    }
}).on('error', (err) => {
    console.log(`❌ Failed to access goodbye page: ${err.message}`);
});

// Test 3: Provide testing instructions
console.log('\n3. Manual testing steps:');
console.log('   📝 Visit your goodbye page');
console.log('   🔍 Fill out the feedback form');
console.log('   🧮 Math verification: solve the simple addition problem');
console.log('   📤 Submit and check for success message');
console.log('   🐙 Verify GitHub issue was created');

console.log('\n4. Monitoring commands:');
console.log('   📊 View logs: npm run feedback:logs');
console.log('   🎯 View issues: npm run feedback:issues');
console.log('   ⚙️  Check env: npm run feedback:env');

console.log('\n🎉 Ready to test!');
console.log('For full setup guide, see: SETUP-GUIDE.md');