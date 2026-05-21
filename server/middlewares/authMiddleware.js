import { requireAuth } from '@clerk/express';

export const protect = requireAuth();

export const adminOnly = (req, res, next) => {
  try {
    const { userId } = req.auth();
    if (!userId || userId !== process.env.ADMIN_USER_ID) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (e) {
    res.status(500).json({ success: false, message: 'Auth error: ' + e.message });
  }
};
