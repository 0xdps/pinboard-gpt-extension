import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import route modules
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

// Create Hono app with basePath
const app = new Hono().basePath('/api');

// CORS middleware
app.use('/*', cors({
	origin: [
		'chrome-extension://*',
		'moz-extension://*',
		'https://pinboardgpt.app',
		'https://api.pinboardgpt.app',
		'http://localhost:3000',
		'http://localhost:8080'
	],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: true,
}));

const rootResponse = (c) => {
	return c.json({
		status: 'ok',
		service: 'Pinboard GPT API',
		version: VERSION,
		timestamp: new Date().toISOString(),
	});
};

app.get('', rootResponse);
app.get('/', rootResponse);
app.get('/health', rootResponse);

// Mount routes
app.route('/auth', authRoutes);
app.route('/user', userRoutes);
app.route('/pins', pinsRoutes);
app.route('/feedback', feedbackRoutes);
app.route('/install', installRoutes);

// Error handling
app.onError((err, c) => {
	console.error('API Error:', err);
	return c.json({ error: 'Something went wrong!', message: err.message }, 500);
});

// Export handler for Vercel
const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
