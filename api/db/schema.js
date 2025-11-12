import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  googleId: text('google_id').unique(),
  name: text('name'),
  picture: text('picture'),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

// Licenses table
export const licenses = sqliteTable('licenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  licenseType: text('license_type').notNull().default('free'), // 'free', 'pro', 'premium'
  licenseKey: text('license_key').unique(),
  activatedAt: integer('activated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // For Premium subscriptions
});

// Pins table (for Premium cloud sync)
export const pins = sqliteTable('pins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title'),
  message: text('message').notNull(),
  tags: text('tags'), // JSON array stored as text
  url: text('url').notNull(),
  conversationId: text('conversation_id'),
  messageId: text('message_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
});

// Feedback table
export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  feedbackId: text('feedback_id').unique().notNull(),
  reasons: text('reasons'), // JSON array stored as text
  rating: integer('rating'),
  feedback: text('feedback'),
  openToContact: integer('open_to_contact', { mode: 'boolean' }).default(false),
  userAgent: text('user_agent'),
  sourceUrl: text('source_url'),
  clientIp: text('client_ip'),
  referrer: text('referrer'),
  extensionVerification: text('extension_verification'),
  extensionData: text('extension_data'), // JSON stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
