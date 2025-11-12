import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import pinsRoutes from './routes/pins.js';
import feedbackRoutes from './routes/feedback.js';
import installRoutes from './routes/install.js';

dotenv.config();

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const VERSION = packageJson.version;

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*',
    'https://pinboard-gpt.dps.codes',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'Pinboard GPT API',
    version: VERSION,
  });
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/user', userRoutes);
app.route('/pins', pinsRoutes);
app.route('/feedback', feedbackRoutes);
app.route('/install', installRoutes);

// Error handling
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Something went wrong!' }, 500);
});

// Export for Vercel Node.js runtime
export default app.fetch;

// Start server only in local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  serve({
    fetch: app.fetch,
    port: PORT,
  });
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Version: ${VERSION}`);
}
