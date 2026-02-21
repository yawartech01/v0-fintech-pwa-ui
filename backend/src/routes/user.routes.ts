import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, uid, email, name, nickname, avatar, phone, referral_code, leader_id, upline_id, 
              is_banned, ban_reason, created_at
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get leader and upline info if exists
    let leaderInfo = null;
    let uplineInfo = null;

    if (user.leader_id) {
      const leader = await db.query(
        'SELECT uid, email, name FROM users WHERE id = $1',
        [user.leader_id]
      );
      if (leader.rows.length > 0) {
        leaderInfo = leader.rows[0];
      }
    }

    if (user.upline_id) {
      const upline = await db.query(
        'SELECT uid, email, name FROM users WHERE id = $1',
        [user.upline_id]
      );
      if (upline.rows.length > 0) {
        uplineInfo = upline.rows[0];
      }
    }

    res.json({
      user: {
        ...user,
        leader: leaderInfo,
        upline: uplineInfo,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update profile (nickname, avatar)
router.patch('/me', [
  authenticate,
  body('nickname').optional().trim().isLength({ min: 2, max: 50 }),
  body('avatar').optional().trim().isLength({ max: 10 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nickname, avatar } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (nickname !== undefined) { fields.push(`nickname = $${idx++}`); values.push(nickname.trim()); }
    if (avatar !== undefined)   { fields.push(`avatar = $${idx++}`);   values.push(avatar); }

    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(req.user!.userId);
    await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`,
      values
    );

    const result = await db.query(
      'SELECT id, uid, email, name, nickname, avatar FROM users WHERE id = $1',
      [req.user!.userId]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get referral stats
router.get('/referral-stats', authenticate, async (req: Request, res: Response) => {
  try {
    // Get direct referrals (L1)
    const l1Result = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE leader_id = $1',
      [req.user!.userId]
    );

    // Get indirect referrals (L2)
    const l2Result = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE upline_id = $1',
      [req.user!.userId]
    );

    // Get total rewards
    const rewardsResult = await db.query(
      `SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount_usdt ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' OR status = 'eligible' THEN amount_usdt ELSE 0 END) as total_pending
       FROM referral_rewards WHERE referrer_id = $1`,
      [req.user!.userId]
    );

    res.json({
      directMembers: parseInt(l1Result.rows[0].count),
      indirectMembers: parseInt(l2Result.rows[0].count),
      totalPaid: parseFloat(rewardsResult.rows[0]?.total_paid || '0'),
      totalPending: parseFloat(rewardsResult.rows[0]?.total_pending || '0'),
    });
  } catch (error) {
    logger.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Get public platform settings (rate, etc.) — accessible by all authenticated users
router.get('/platform-settings', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT key, value FROM platform_settings WHERE key IN ('usdt_inr_rate', 'admin_banner', 'withdrawal_fee', 'min_withdrawal')`
    );
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({
      usdtInrRate: settings['usdt_inr_rate'] || '90',
      withdrawalFee: settings['withdrawal_fee'] || '1',
      minWithdrawal: settings['min_withdrawal'] || '10',
      adminBanner: settings['admin_banner'] || '',
    });
  } catch (error) {
    logger.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

export default router;
