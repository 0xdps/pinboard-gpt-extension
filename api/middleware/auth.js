import jwt from 'jsonwebtoken';
import { createMiddleware } from 'hono/factory';

export const authenticateToken = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return c.json({ error: 'Access token required' }, 401);
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    c.set('user', user); // { userId, email }
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 403);
  }
});

export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}
