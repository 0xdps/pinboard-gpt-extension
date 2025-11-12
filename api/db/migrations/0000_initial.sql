CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  name TEXT,
  picture TEXT,
  password_hash TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  license_type TEXT NOT NULL DEFAULT 'free',
  license_key TEXT UNIQUE,
  activated_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT,
  message TEXT NOT NULL,
  tags TEXT,
  url TEXT NOT NULL,
  conversation_id TEXT,
  message_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id TEXT UNIQUE NOT NULL,
  reasons TEXT,
  rating INTEGER,
  feedback TEXT,
  open_to_contact INTEGER DEFAULT 0,
  user_agent TEXT,
  source_url TEXT,
  client_ip TEXT,
  referrer TEXT,
  extension_verification TEXT,
  extension_data TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_user_id ON pins(user_id);
CREATE INDEX IF NOT EXISTS idx_pins_is_deleted ON pins(is_deleted);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
