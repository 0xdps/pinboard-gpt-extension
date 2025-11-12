import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { users, licenses, pins, feedback } from './schema.js';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema: { users, licenses, pins, feedback } });

// Helper function to run migrations if needed
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './api/db/migrations' });
}
