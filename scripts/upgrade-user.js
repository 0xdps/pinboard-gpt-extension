#!/usr/bin/env node

/**
 * Script to upgrade a user from FREE to PRO or PREMIUM
 * 
 * Usage:
 *   node scripts/upgrade-user.js <email> <license-type> [expires-in-days]
 * 
 * Examples:
 *   node scripts/upgrade-user.js user@example.com pro
 *   node scripts/upgrade-user.js user@example.com premium 365
 */

// Run from api directory: cd api && node ../scripts/upgrade-user.js
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Loads from api/.env when run from api directory
dotenv.config({ path: '../.env' }); // Fallback to root .env

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

// Generate a license key
function generateLicenseKey(type) {
  const prefix = type.toUpperCase().substring(0, 3);
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${prefix}-${random.toUpperCase().substring(0, 8)}-${random.toUpperCase().substring(8, 16)}`;
}

// Get command line arguments
const [email, licenseType, expiresInDays] = process.argv.slice(2);

if (!email || !licenseType) {
  console.error('❌ Usage: node scripts/upgrade-user.js <email> <license-type> [expires-in-days]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/upgrade-user.js user@example.com pro');
  console.error('  node scripts/upgrade-user.js user@example.com premium 365');
  console.error('');
  console.error('License types: free, pro, premium');
  process.exit(1);
}

// Validate license type
const validTypes = ['free', 'pro', 'premium'];
if (!validTypes.includes(licenseType.toLowerCase())) {
  console.error(`❌ Invalid license type: ${licenseType}`);
  console.error(`   Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

async function upgradeUser() {
  try {
    console.log('🔍 Looking up user...');
    
    // Find user by email
    const userResult = await db.execute({
      sql: 'SELECT id, email, name FROM users WHERE email = ?',
      args: [email]
    });

    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.name || 'N/A'} (${user.email})`);
    console.log(`   User ID: ${user.id}`);

    // Check current license
    const licenseResult = await db.execute({
      sql: 'SELECT id, license_type, expires_at FROM licenses WHERE user_id = ?',
      args: [user.id]
    });

    if (licenseResult.rows.length === 0) {
      console.error(`❌ No license found for user`);
      process.exit(1);
    }

    const currentLicense = licenseResult.rows[0];
    console.log(`📋 Current license: ${currentLicense.license_type.toUpperCase()}`);
    
    if (currentLicense.expires_at) {
      const expiresDate = new Date(currentLicense.expires_at * 1000);
      console.log(`   Expires: ${expiresDate.toLocaleDateString()}`);
    }

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays) {
      const days = parseInt(expiresInDays);
      if (isNaN(days) || days <= 0) {
        console.error(`❌ Invalid number of days: ${expiresInDays}`);
        process.exit(1);
      }
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      expiresAt = Math.floor(expirationDate.getTime() / 1000);
      console.log(`⏰ Will expire in ${days} days (${expirationDate.toLocaleDateString()})`);
    }

    // Generate license key
    const licenseKey = generateLicenseKey(licenseType);
    console.log(`🔑 Generated license key: ${licenseKey}`);

    // Update license
    console.log(`\n🔄 Upgrading to ${licenseType.toUpperCase()}...`);
    
    if (expiresAt) {
      await db.execute({
        sql: 'UPDATE licenses SET license_type = ?, license_key = ?, expires_at = ? WHERE user_id = ?',
        args: [licenseType.toLowerCase(), licenseKey, expiresAt, user.id]
      });
    } else {
      await db.execute({
        sql: 'UPDATE licenses SET license_type = ?, license_key = ?, expires_at = NULL WHERE user_id = ?',
        args: [licenseType.toLowerCase(), licenseKey, user.id]
      });
    }

    console.log('✅ License upgraded successfully!');
    console.log('');
    console.log('📊 New license details:');
    console.log(`   Type: ${licenseType.toUpperCase()}`);
    console.log(`   Key: ${licenseKey}`);
    if (expiresAt) {
      console.log(`   Expires: ${new Date(expiresAt * 1000).toLocaleDateString()}`);
    } else {
      console.log(`   Expires: Never`);
    }
    console.log('');
    console.log('✨ User will see the new license next time they sync with the server.');

  } catch (error) {
    console.error('❌ Error upgrading user:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    db.close();
  }
}

upgradeUser();
