import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, licenses } from '../db/schema.js';
import { generateToken } from '../middleware/auth.js';

const app = new Hono();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In
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

// Email/Password Registration
app.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.insert(users).values({
      email,
      name,
      passwordHash,
    }).returning();
    const user = result[0];

    // Create free license
    await db.insert(licenses).values({
      userId: user.id,
      licenseType: 'free',
    });

    // Generate JWT
    const token = generateToken(user.id, user.email);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      license: {
        type: 'free',
        expiresAt: null,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Email/Password Login
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user || !user.passwordHash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Get license
    const license = await db.select().from(licenses).where(eq(licenses.userId, user.id)).get();

    // Generate JWT
    const token = generateToken(user.id, user.email);

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      license: {
        type: license.licenseType,
        expiresAt: license.expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

export default app;
