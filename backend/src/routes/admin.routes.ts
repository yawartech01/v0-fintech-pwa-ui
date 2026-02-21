import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { authenticateAdmin } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';
import { io } from '../server';

const router = Router();

function adminDbId(req: Request): string | null {
  const uid = req.user?.userId;
  if (!uid || uid === 'admin') return null;
  return uid;
}

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF allowed.'));
  },
});

// ========== DASHBOARD & STATS ==========

router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // Get all stats in parallel
    const [users, wallets, deposits, withdrawals, ads, requests] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT SUM(available_usdt) as available, SUM(locked_usdt) as locked FROM wallets'),
      db.query("SELECT COUNT(*) FROM deposits WHERE status = 'confirmed'"),
      db.query("SELECT COUNT(*) FROM withdrawals WHERE status = 'under_review'"),
      db.query("SELECT COUNT(*) FROM sell_ads WHERE status = 'ACTIVE'"),
      db.query("SELECT COUNT(*) FROM ad_edit_requests WHERE status = 'PENDING'"),
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      treasuryBalance: parseFloat(wallets.rows[0]?.available || '0'),
      totalLocked: parseFloat(wallets.rows[0]?.locked || '0'),
      totalDeposits: parseInt(deposits.rows[0].count),
      pendingWithdrawals: parseInt(withdrawals.rows[0].count),
      activeAds: parseInt(ads.rows[0].count),
      pendingRequests: parseInt(requests.rows[0].count),
    });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ========== USERS MANAGEMENT ==========

router.get('/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.uid, u.email, u.name, u.nickname, u.phone, u.referral_code, 
              u.is_banned, u.ban_reason, u.created_at,
              w.available_usdt, w.locked_usdt, w.total_usdt,
              (SELECT address FROM deposit_addresses WHERE user_id = u.id AND network = 'TRC20' LIMIT 1) as deposit_address
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC
       LIMIT 1000`
    );

    res.json({ users: result.rows });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.post('/users/:id/ban', [
  authenticateAdmin,
  body('reason').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.query(
      `UPDATE users 
       SET is_banned = true, ban_reason = $1, banned_at = CURRENT_TIMESTAMP, banned_by = $2
       WHERE id = $3`,
      [reason, adminDbId(req), id]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_log (action, admin_id, user_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      ['user_banned', adminDbId(req), id, JSON.stringify({ reason }), req.ip]
    );

    logger.info(`User banned: ${id}`);

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    logger.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:id/unban', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE users SET is_banned = false, ban_reason = NULL, banned_at = NULL WHERE id = $1',
      [id]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_log (action, admin_id, user_id, ip_address)
       VALUES ($1, $2, $3, $4)`,
      ['user_unbanned', adminDbId(req), id, req.ip]
    );

    logger.info(`User unbanned: ${id}`);

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    logger.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

router.post('/users/:id/adjust-balance', [
  authenticateAdmin,
  body('amount').isFloat(),
  body('operation').isIn(['add', 'deduct']),
  body('reason').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, operation, reason } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      if (operation === 'add') {
        await client.query(
          'UPDATE wallets SET available_usdt = available_usdt + ROUND($1::numeric, 6) WHERE user_id = $2',
          [amount, id]
        );
      } else {
        await client.query(
          'UPDATE wallets SET available_usdt = available_usdt - ROUND($1::numeric, 6) WHERE user_id = $2',
          [amount, id]
        );
      }

      // Log audit
      await client.query(
        `INSERT INTO audit_log (action, admin_id, user_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        ['balance_adjustment', adminDbId(req), id, 
         JSON.stringify({ amount, operation, reason }), req.ip]
      );

      await client.query('COMMIT');

      // Emit real-time update to user
      io.to(`user_${id}`).emit('wallet_updated');

      logger.info(`Balance adjusted: ${id} - ${operation} ${amount}`);

      res.json({ message: 'Balance adjusted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Adjust balance error:', error);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
});

// ========== WITHDRAWALS MANAGEMENT ==========

router.get('/withdrawals', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT w.*, u.email, u.uid
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
    `;

    const params: any[] = [];
    if (status && status !== 'all') {
      query += ' WHERE w.status = $1';
      params.push(status);
    }

    query += ' ORDER BY w.created_at DESC LIMIT 500';

    const result = await db.query(query, params);

    res.json({ withdrawals: result.rows });
  } catch (error) {
    logger.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

router.post('/withdrawals/:id/approve', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get withdrawal
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (withdrawalResult.rows.length === 0) {
        throw new Error('Withdrawal not found');
      }

      const withdrawal = withdrawalResult.rows[0];

      if (withdrawal.status !== 'under_review') {
        throw new Error('Withdrawal already processed');
      }

      // Generate mock txHash (in production, use real blockchain transaction)
      const txHash = 'TX' + Math.random().toString(36).substring(2, 35).toUpperCase();

      // Update withdrawal status
      await client.query(
        `UPDATE withdrawals 
         SET status = 'completed', tx_hash = $1, 
             reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, 
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [txHash, adminDbId(req), id]
      );

      await client.query(
        'UPDATE wallets SET locked_usdt = locked_usdt - ROUND($1::numeric, 6) WHERE user_id = $2',
        [withdrawal.amount_usdt, withdrawal.user_id]
      );

      await client.query(
        `INSERT INTO audit_log (action, admin_id, user_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        ['withdrawal_approved', adminDbId(req), withdrawal.user_id,
         JSON.stringify({ withdrawalId: id, amount: withdrawal.amount_usdt, txHash }), req.ip]
      );

      await client.query('COMMIT');

      // Emit real-time updates
      io.to(`user_${withdrawal.user_id}`).emit('wallet_updated');
      io.to(`user_${withdrawal.user_id}`).emit('withdrawal_updated', { id, status: 'completed' });

      logger.info(`Withdrawal approved: ${id}`);

      res.json({ message: 'Withdrawal approved', txHash });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

router.post('/withdrawals/:id/reject', [
  authenticateAdmin,
  body('reason').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get withdrawal
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (withdrawalResult.rows.length === 0) {
        throw new Error('Withdrawal not found');
      }

      const withdrawal = withdrawalResult.rows[0];

      if (withdrawal.status !== 'under_review') {
        throw new Error('Withdrawal already processed');
      }

      // Update withdrawal status
      await client.query(
        `UPDATE withdrawals 
         SET status = 'rejected', rejection_reason = $1,
             reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
         WHERE id = $3`,
        [reason, adminDbId(req), id]
      );

      await client.query(
        `UPDATE wallets 
         SET locked_usdt = locked_usdt - ROUND($1::numeric, 6), available_usdt = available_usdt + ROUND($1::numeric, 6)
         WHERE user_id = $2`,
        [withdrawal.amount_usdt, withdrawal.user_id]
      );

      await client.query(
        `INSERT INTO audit_log (action, admin_id, user_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        ['withdrawal_rejected', adminDbId(req), withdrawal.user_id,
         JSON.stringify({ withdrawalId: id, amount: withdrawal.amount_usdt, reason }), req.ip]
      );

      await client.query('COMMIT');

      // Emit real-time updates
      io.to(`user_${withdrawal.user_id}`).emit('wallet_updated');
      io.to(`user_${withdrawal.user_id}`).emit('withdrawal_updated', { id, status: 'rejected' });

      logger.info(`Withdrawal rejected: ${id}`);

      res.json({ message: 'Withdrawal rejected' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// ========== SELL ADS MANAGEMENT ==========

router.get('/ads', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT sa.*, u.email, u.uid,
             ba.bank_name, ba.account_holder_name, ba.account_number, ba.ifsc_code
      FROM sell_ads sa
      JOIN users u ON sa.user_id = u.id
      JOIN bank_accounts ba ON sa.bank_account_id = ba.id
    `;

    const params: any[] = [];
    if (status && status !== 'all') {
      query += ' WHERE sa.status = $1';
      params.push(status);
    }

    query += ' ORDER BY sa.created_at DESC LIMIT 500';

    const result = await db.query(query, params);

    res.json({ ads: result.rows });
  } catch (error) {
    logger.error('Get ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

router.post('/ads/:id/complete', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get ad
      const adResult = await client.query(
        'SELECT * FROM sell_ads WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (adResult.rows.length === 0) {
        throw new Error('Ad not found');
      }

      const ad = adResult.rows[0];

      if (ad.status === 'COMPLETED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Ad already completed' });
      }

      const remainingUsdt = parseFloat(ad.amount_remaining_usdt);
      if (!Number.isFinite(remainingUsdt) || remainingUsdt < 0) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Ad has invalid remaining amount' });
      }

      // Lock wallet row to prevent concurrent modifications
      await client.query(
        'SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE',
        [ad.user_id]
      );

      await client.query(
        `UPDATE sell_ads 
         SET status = 'COMPLETED', amount_remaining_usdt = 0, 
             completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );

      // Only deduct from locked if there was remaining balance locked (ACTIVE ads)
      if (remainingUsdt > 0) {
        if (ad.status === 'ACTIVE') {
          // ACTIVE → COMPLETED: deduct from locked
          await client.query(
            'UPDATE wallets SET locked_usdt = locked_usdt - ROUND($1::numeric, 6) WHERE user_id = $2',
            [remainingUsdt, ad.user_id]
          );
        } else if (ad.status === 'PAUSED') {
          // PAUSED → COMPLETED: funds are already unlocked (returned to available on pause), no wallet change needed
          logger.info(`Completing paused ad ${id} — no locked funds to deduct`);
        }
      }

      // Post-transaction integrity check
      const verifyResult = await client.query(
        'SELECT available_usdt, locked_usdt FROM wallets WHERE user_id = $1',
        [ad.user_id]
      );
      const postAvailable = parseFloat(verifyResult.rows[0].available_usdt);
      const postLocked = parseFloat(verifyResult.rows[0].locked_usdt);
      if (postAvailable < 0 || postLocked < 0) {
        await client.query('ROLLBACK');
        logger.error(`Balance integrity violation on ad completion: user=${ad.user_id}, available=${postAvailable}, locked=${postLocked}`);
        return res.status(500).json({ error: 'Transaction failed — balance integrity check' });
      }

      await client.query(
        `INSERT INTO audit_log (action, admin_id, user_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        ['ad_completed', adminDbId(req), ad.user_id,
         JSON.stringify({ adId: id, amount: ad.amount_total_usdt }), req.ip]
      );

      // Create in-app notification for user
      const adCode = ad.ad_code || id.slice(0, 8).toUpperCase();
      const amount = parseFloat(ad.amount_total_usdt).toFixed(2);
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'payment', $2, $3, $4)`,
        [
          ad.user_id,
          `Payment Received — ${adCode}`,
          `Your sell ad ${adCode} for ${amount} USDT has been processed. The payment has been sent to your bank account.`,
          JSON.stringify({ adId: id, adCode, amount }),
        ]
      );

      await client.query('COMMIT');

      // Emit real-time updates
      io.to(`user_${ad.user_id}`).emit('wallet_updated');
      io.to(`user_${ad.user_id}`).emit('ad_updated', { id, status: 'COMPLETED' });
      io.to(`user_${ad.user_id}`).emit('notification_new', {
        title: `Payment Received — ${adCode}`,
        message: `Your ad ${adCode} (${amount} USDT) has been paid.`,
      });

      logger.info(`Ad completed: ${id}`);

      res.json({ message: 'Ad marked as completed' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Complete ad error:', error);
    res.status(500).json({ error: 'Failed to complete ad' });
  }
});

router.post('/ads/:id/upload-receipt', [
  authenticateAdmin,
  upload.single('receipt'),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const receiptPath = `/uploads/${req.file.filename}`;

    await db.query(
      `UPDATE sell_ads 
       SET payment_receipt = $1, payment_receipt_uploaded_at = CURRENT_TIMESTAMP,
           payment_receipt_uploaded_by = $2
       WHERE id = $3`,
      [receiptPath, adminDbId(req), id]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_log (action, admin_id, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      ['receipt_uploaded', adminDbId(req), JSON.stringify({ adId: id }), req.ip]
    );

    logger.info(`Receipt uploaded for ad: ${id}`);

    res.json({ message: 'Receipt uploaded', receiptPath });
  } catch (error) {
    logger.error('Upload receipt error:', error);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
});

// ========== AD REQUESTS MANAGEMENT ==========

router.get('/ad-requests', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [editRequests, deleteRequests] = await Promise.all([
      db.query(
        `SELECT er.*, sa.amount_total_usdt, sa.amount_remaining_usdt, u.email, u.uid
         FROM ad_edit_requests er
         JOIN sell_ads sa ON er.ad_id = sa.id
         JOIN users u ON er.user_id = u.id
         WHERE er.status = 'PENDING'
         ORDER BY er.created_at DESC`
      ),
      db.query(
        `SELECT dr.*, sa.amount_total_usdt, sa.amount_remaining_usdt, u.email, u.uid
         FROM ad_delete_requests dr
         JOIN sell_ads sa ON dr.ad_id = sa.id
         JOIN users u ON dr.user_id = u.id
         WHERE dr.status = 'PENDING'
         ORDER BY dr.created_at DESC`
      ),
    ]);

    res.json({
      editRequests: editRequests.rows,
      deleteRequests: deleteRequests.rows,
    });
  } catch (error) {
    logger.error('Get ad requests error:', error);
    res.status(500).json({ error: 'Failed to get ad requests' });
  }
});

router.post('/ad-requests/:id/approve', [
  authenticateAdmin,
  body('type').isIn(['edit', 'delete']),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      if (type === 'edit') {
        // Get edit request
        const requestResult = await client.query(
          'SELECT * FROM ad_edit_requests WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (requestResult.rows.length === 0) {
          throw new Error('Request not found');
        }

        const request = requestResult.rows[0];
        const changes = request.requested_changes;

        // Apply changes to ad
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (changes.bankAccountId) {
          updateFields.push(`bank_account_id = $${paramIndex++}`);
          updateValues.push(changes.bankAccountId);
        }

        updateValues.push(request.ad_id);
        await client.query(
          `UPDATE sell_ads SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $${paramIndex}`,
          updateValues
        );

        // Update request status
        await client.query(
          `UPDATE ad_edit_requests 
           SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1
           WHERE id = $2`,
          [adminDbId(req), id]
        );
      } else {
        // Get delete request
        const requestResult = await client.query(
          'SELECT * FROM ad_delete_requests WHERE id = $1 FOR UPDATE',
          [id]
        );

        if (requestResult.rows.length === 0) {
          throw new Error('Request not found');
        }

        const request = requestResult.rows[0];

        // Get ad
        const adResult = await client.query(
          'SELECT * FROM sell_ads WHERE id = $1 FOR UPDATE',
          [request.ad_id]
        );

        const ad = adResult.rows[0];

        // Refund if active
        if (ad.status === 'ACTIVE') {
          await client.query(
            `UPDATE wallets 
             SET locked_usdt = locked_usdt - ROUND($1::numeric, 6), available_usdt = available_usdt + ROUND($1::numeric, 6)
             WHERE user_id = $2`,
            [ad.amount_remaining_usdt, request.user_id]
          );
        }

        // Delete ad
        await client.query('DELETE FROM sell_ads WHERE id = $1', [request.ad_id]);

        // Update request status
        await client.query(
          `UPDATE ad_delete_requests 
           SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1
           WHERE id = $2`,
          [adminDbId(req), id]
        );
      }

      // Log audit
      await client.query(
        `INSERT INTO audit_log (action, admin_id, details, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [`ad_${type}_request_approved`, adminDbId(req), JSON.stringify({ requestId: id }), req.ip]
      );

      await client.query('COMMIT');

      logger.info(`Ad ${type} request approved: ${id}`);

      res.json({ message: 'Request approved' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

router.post('/ad-requests/:id/reject', [
  authenticateAdmin,
  body('type').isIn(['edit', 'delete']),
  body('reason').trim().notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body;

    const table = type === 'edit' ? 'ad_edit_requests' : 'ad_delete_requests';

    await db.query(
      `UPDATE ${table}
       SET status = 'REJECTED', rejection_reason = $1,
           reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
       WHERE id = $3`,
      [reason, adminDbId(req), id]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_log (action, admin_id, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [`ad_${type}_request_rejected`, adminDbId(req), 
       JSON.stringify({ requestId: id, reason }), req.ip]
    );

    logger.info(`Ad ${type} request rejected: ${id}`);

    res.json({ message: 'Request rejected' });
  } catch (error) {
    logger.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ========== PLATFORM SETTINGS ==========

router.get('/settings', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM platform_settings');

    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', [
  authenticateAdmin,
  body('key').isIn(['usdt_inr_rate', 'admin_banner', 'withdrawal_fee', 'min_withdrawal', 'sweep_threshold']),
  body('value').exists(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
    }

    const { key, value } = req.body;

    await db.query(
      `INSERT INTO platform_settings (key, value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE 
       SET value = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3`,
      [key, String(value), adminDbId(req)]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_log (action, admin_id, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      ['settings_updated', adminDbId(req), JSON.stringify({ key, value }), req.ip]
    );

    // Emit real-time update to all clients
    if (key === 'usdt_inr_rate') {
      io.emit('rate_updated', { rate: parseFloat(value) });
    } else if (key === 'admin_banner') {
      io.emit('banner_updated', { message: value });
    }

    logger.info(`Settings updated: ${key} = ${value}`);

    res.json({ message: 'Settings updated' });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ========== AUDIT LOG ==========

router.get('/audit-log', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { action, limit = 100 } = req.query;

    let query = 'SELECT * FROM audit_log';
    const params: any[] = [];

    if (action) {
      query += ' WHERE action = $1';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string));

    const result = await db.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    logger.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// Get all deposits (admin)
router.get('/deposits', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT d.*, u.email as user_email, COALESCE(u.nickname, u.name) as user_nickname
      FROM deposits d
      JOIN users u ON u.id = d.user_id
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` WHERE d.status = $${params.length}`;
    }

    query += ' ORDER BY d.created_at DESC LIMIT 200';

    const result = await db.query(query, params);
    res.json({ deposits: result.rows });
  } catch (error) {
    logger.error('Admin get deposits error:', error);
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

export default router;
