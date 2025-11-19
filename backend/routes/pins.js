import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import { db } from '../db/index.js';
import { pins, licenses } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const app = new Hono();

// Middleware to check Premium license
const requirePremium = createMiddleware(async (c, next) => {
  try {
    const user = c.get('user');
    const license = await db.select().from(licenses).where(eq(licenses.userId, user.userId)).get();

    if (!license || license.licenseType !== 'premium') {
      return c.json({ error: 'Premium license required' }, 403);
    }

    // Check if license is expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return c.json({ error: 'Premium license expired' }, 403);
    }

    await next();
  } catch (error) {
    console.error('License check error:', error);
    return c.json({ error: 'License check failed' }, 500);
  }
});

// Sync pins to cloud (upload)
app.post('/sync', authenticateToken, requirePremium, async (c) => {
  try {
    const user = c.get('user');
    const { pins: userPins } = await c.req.json();

    if (!Array.isArray(userPins)) {
      return c.json({ error: 'Pins must be an array' }, 400);
    }

    // Delete all existing pins for user
    await db.delete(pins).where(eq(pins.userId, user.userId));

    // Insert new pins
    if (userPins.length > 0) {
      const pinsToInsert = userPins.map(pin => ({
        userId: user.userId,
        title: pin.title || null,
        message: pin.message,
        tags: JSON.stringify(pin.tags || []),
        url: pin.url,
        conversationId: pin.conversationId || null,
        messageId: pin.messageId || null,
        createdAt: pin.timestamp ? new Date(pin.timestamp) : new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      }));

      await db.insert(pins).values(pinsToInsert);
    }

    return c.json({
      success: true,
      synced: userPins.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pin sync error:', error);
    return c.json({ error: 'Failed to sync pins' }, 500);
  }
});

// Fetch pins from cloud (download)
app.get('/sync', authenticateToken, requirePremium, async (c) => {
  try {
    const user = c.get('user');
    const userPins = await db.select()
      .from(pins)
      .where(and(
        eq(pins.userId, user.userId),
        eq(pins.isDeleted, false)
      ))
      .orderBy(desc(pins.createdAt));

    const formattedPins = userPins.map(pin => ({
      title: pin.title,
      message: pin.message,
      tags: JSON.parse(pin.tags || '[]'),
      url: pin.url,
      conversationId: pin.conversationId,
      messageId: pin.messageId,
      timestamp: pin.createdAt.getTime(),
    }));

    return c.json({
      pins: formattedPins,
      count: formattedPins.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pin fetch error:', error);
    return c.json({ error: 'Failed to fetch pins' }, 500);
  }
});

// Delete a specific pin
app.delete('/:id', authenticateToken, requirePremium, async (c) => {
  try {
    const user = c.get('user');
    const pinId = parseInt(c.req.param('id'));

    // Soft delete
    await db.update(pins)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(
        eq(pins.id, pinId),
        eq(pins.userId, user.userId)
      ));

    return c.json({ success: true });
  } catch (error) {
    console.error('Pin delete error:', error);
    return c.json({ error: 'Failed to delete pin' }, 500);
  }
});

export default app;
