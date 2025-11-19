import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, licenses } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const app = new Hono();

// Get user's license information
app.get('/license', authenticateToken, async (c) => {
  try {
    const user = c.get('user');
    const license = await db.select().from(licenses).where(eq(licenses.userId, user.userId)).get();

    if (!license) {
      return c.json({ error: 'License not found' }, 404);
    }

    return c.json({
      type: license.licenseType,
      licenseKey: license.licenseKey,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
    });
  } catch (error) {
    console.error('License fetch error:', error);
    return c.json({ error: 'Failed to fetch license' }, 500);
  }
});

// Activate a license key
app.post('/activate', authenticateToken, async (c) => {
  try {
    const user = c.get('user');
    const { licenseKey } = await c.req.json();

    if (!licenseKey) {
      return c.json({ error: 'License key required' }, 400);
    }

    // Validate license key format (PINGPT-TYPE-RANDOM-CHECKSUM)
    const keyRegex = /^PINGPT-(FREE|PRO|PREMIUM)-[A-Z0-9]{6}-[A-Z0-9]{6}$/;
    if (!keyRegex.test(licenseKey)) {
      return c.json({ error: 'Invalid license key format' }, 400);
    }

    // Extract license type from key
    const licenseType = licenseKey.split('-')[1].toLowerCase();

    // Check if key is already used
    const existingLicense = await db.select().from(licenses).where(eq(licenses.licenseKey, licenseKey)).get();
    
    // Allow multi-device activation: same key can be used on multiple devices by same user
    if (existingLicense && existingLicense.userId !== user.userId) {
      return c.json({ error: 'License key already activated by another user' }, 400);
    }

    // Update or create license
    const userLicense = await db.select().from(licenses).where(eq(licenses.userId, user.userId)).get();

    if (userLicense) {
      // Update existing license
      await db.update(licenses)
        .set({
          licenseType,
          licenseKey,
          activatedAt: new Date(),
          expiresAt: licenseType === 'premium' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        })
        .where(eq(licenses.userId, user.userId));
    } else {
      // Create new license
      await db.insert(licenses).values({
        userId: user.userId,
        licenseType,
        licenseKey,
        activatedAt: new Date(),
        expiresAt: licenseType === 'premium' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      });
    }

    return c.json({
      success: true,
      type: licenseType,
      expiresAt: licenseType === 'premium' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
    });
  } catch (error) {
    console.error('License activation error:', error);
    return c.json({ error: 'Failed to activate license' }, 500);
  }
});

// Get user profile
app.get('/profile', authenticateToken, async (c) => {
  try {
    const authUser = c.get('user');
    const user = await db.select().from(users).where(eq(users.id, authUser.userId)).get();
    const license = await db.select().from(licenses).where(eq(licenses.userId, authUser.userId)).get();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      license: {
        type: license?.licenseType || 'free',
        expiresAt: license?.expiresAt,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

export default app;
