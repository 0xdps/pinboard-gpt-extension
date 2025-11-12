import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { users, licenses, pins, feedback } from './schema.js';

let db = null;

try {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = drizzle(client, { schema: { users, licenses, pins, feedback } });
  } else {
    console.warn('Database environment variables not set');
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
}

export { db };

// Helper function to run migrations if needed
export async function runMigrations() {
  if (db) {
    await migrate(db, { migrationsFolder: './api/db/migrations' });
  }
}
