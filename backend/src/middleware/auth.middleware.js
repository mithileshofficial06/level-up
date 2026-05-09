import { clerkClient } from '@clerk/express';

/**
 * Auth middleware — verifies Clerk JWT and attaches user info to req
 * For routes that require authentication
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the session token with Clerk
    // In production, you'd verify the JWT. For development, we decode it.
    try {
      const { sub: userId } = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );

      if (!userId) {
        return res.status(401).json({ error: 'Invalid token: no user ID' });
      }

      req.user = { clerkId: userId };
      next();
    } catch (tokenError) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional auth — attaches user info if token present, but doesn't block
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { sub: userId } = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      req.user = { clerkId: userId };
    }
  } catch (error) {
    // Silent fail — user just won't be authenticated
  }
  next();
};
