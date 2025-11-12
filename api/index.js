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

// Health check - simple endpoint that doesn't require DB
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Pinboard GPT API',
    version: VERSION,
    timestamp: new Date().toISOString(),
  });
});

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
// Convert Vercel's Node.js request/response to Web API format
export default async (req, res) => {
  try {
    // Build URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const url = new URL(req.url, `${protocol}://${host}`);

    // Convert Node.js request to Web API Request
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    // Create Web API Request
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body ? body : undefined,
    });

    // Call Hono app
    const response = await app.fetch(request);

    // Set response status and headers
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send response body
    if (response.body) {
      const reader = response.body.getReader();
      let result;
      while (!(result = await reader.read()).done) {
        res.write(result.value);
      }
    }
    res.end();
  } catch (error) {
    console.error('Handler error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
  }
};

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
