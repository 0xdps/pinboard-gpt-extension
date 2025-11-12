-- Drop all tables in reverse order (to handle foreign keys)
DROP TABLE IF EXISTS pins;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS __drizzle_migrations;
