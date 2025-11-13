#!/usr/bin/env node

/**
 * Script to list all users and their licenses
 * 
 * Usage:
 *   node scripts/list-users.js [license-type]
 * 
 * Examples:
 *   node scripts/list-users.js           # List all users
 *   node scripts/list-users.js pro       # List only PRO users
 *   node scripts/list-users.js premium   # List only PREMIUM users
 */

// Run from api directory: cd api && node ../scripts/list-users.js
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Loads from api/.env when run from api directory
dotenv.config({ path: '../.env' }); // Fallback to root .env

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

const filterType = process.argv[2]?.toLowerCase();

async function listUsers() {
  try {
    console.log('📊 Fetching users...\n');

    // Query users with their licenses
    const sql = filterType
      ? `SELECT u.id, u.email, u.name, u.created_at, l.license_type, l.expires_at 
         FROM users u 
         LEFT JOIN licenses l ON u.id = l.user_id 
         WHERE l.license_type = ?
         ORDER BY u.created_at DESC`
      : `SELECT u.id, u.email, u.name, u.created_at, l.license_type, l.expires_at 
         FROM users u 
         LEFT JOIN licenses l ON u.id = l.user_id 
         ORDER BY u.created_at DESC`;

    const result = await db.execute({
      sql,
      args: filterType ? [filterType] : []
    });

    if (result.rows.length === 0) {
      console.log('No users found.');
      return;
    }

    // Count by license type
    const counts = {
      free: 0,
      pro: 0,
      premium: 0,
      none: 0
    };

    result.rows.forEach(row => {
      const type = row.license_type?.toLowerCase() || 'none';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Display summary
    console.log('📈 Summary:');
    console.log(`   Total Users: ${result.rows.length}`);
    console.log(`   FREE: ${counts.free}`);
    console.log(`   PRO: ${counts.pro}`);
    console.log(`   PREMIUM: ${counts.premium}`);
    if (counts.none > 0) {
      console.log(`   No License: ${counts.none}`);
    }
    console.log('');

    // Display user table
    console.log('┌────────┬─────────────────────────────────┬──────────────────────┬──────────┬─────────────┐');
    console.log('│ ID     │ Email                           │ Name                 │ License  │ Expires     │');
    console.log('├────────┼─────────────────────────────────┼──────────────────────┼──────────┼─────────────┤');

    result.rows.forEach(row => {
      const id = String(row.id).padEnd(6);
      const email = String(row.email || 'N/A').substring(0, 31).padEnd(31);
      const name = String(row.name || 'N/A').substring(0, 20).padEnd(20);
      const license = String(row.license_type || 'NONE').toUpperCase().padEnd(8);
      
      let expires = 'Never';
      if (row.expires_at) {
        const date = new Date(row.expires_at * 1000);
        expires = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
      expires = expires.padEnd(11);

      console.log(`│ ${id} │ ${email} │ ${name} │ ${license} │ ${expires} │`);
    });

    console.log('└────────┴─────────────────────────────────┴──────────────────────┴──────────┴─────────────┘');
    console.log('');
    console.log('💡 To upgrade a user: node scripts/upgrade-user.js <email> <license-type>');

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

listUsers();
