import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, licenses } from '../db/schema.js';
import { generateToken } from '../middleware/auth.js';

const app = new Hono();
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://pinboardgpt.app/auth/callback'
);

// Generate a license key
function generateLicenseKey(type = 'free') {
  const prefix = type.toUpperCase().substring(0, 3);
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${prefix}-${random.toUpperCase().substring(0, 8)}-${random.toUpperCase().substring(8, 16)}`;
}

// Get Google OAuth URL
app.get('/google/url', async (c) => {
  try {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'select_account'
    });

    return c.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return c.json({ error: 'Failed to generate auth URL' }, 500);
  }
});

// Handle OAuth callback
app.get('/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    
    if (!code) {
      return c.json({ error: 'No authorization code provided' }, 400);
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await db.select().from(users).where(eq(users.googleId, googleId)).get();

    if (!user) {
      // Create new user
      const result = await db.insert(users).values({
        googleId,
        email,
        name,
        picture,
      }).returning();
      user = result[0];

      // Create free license for new user
      await db.insert(licenses).values({
        userId: user.id,
        licenseType: 'free',
        licenseKey: generateLicenseKey('free'),
      });
    }

    // Generate JWT
    const jwtToken = generateToken(user.id, user.email);

    // Get user's license
    const license = await db.select().from(licenses).where(eq(licenses.userId, user.id)).get();

    return c.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      license: {
        type: license.licenseType,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Authentication failed' }, 400);
  }
});

// Google Sign-In (legacy endpoint - kept for backward compatibility)
app.post('/google', async (c) => {
  try {
    const { token } = await c.req.json();

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await db.select().from(users).where(eq(users.googleId, googleId)).get();

    if (!user) {
      // Create new user
      const result = await db.insert(users).values({
        googleId,
        email,
        name,
        picture,
      }).returning();
      user = result[0];

      // Create free license for new user
      await db.insert(licenses).values({
        userId: user.id,
        licenseType: 'free',
        licenseKey: generateLicenseKey('free'),
      });
    }

    // Generate JWT
    const jwtToken = generateToken(user.id, user.email);

    // Get user's license
    const license = await db.select().from(licenses).where(eq(licenses.userId, user.id)).get();

    return c.json({
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      license: {
        type: license.licenseType,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return c.json({ error: 'Invalid Google token' }, 400);
  }
});

export default app;
