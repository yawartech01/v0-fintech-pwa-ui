import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';

const router = Router();

// Get all notifications for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, type, title, message, data, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user!.userId]
    );
    const unreadCount = result.rows.filter((n: any) => !n.is_read).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark single notification as read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    logger.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user!.userId]
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    logger.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
