import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';
import { io } from '../server';

const router = Router();

// Get all sell ads for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT sa.*, ba.bank_name, ba.account_holder_name, ba.account_number, ba.ifsc_code
       FROM sell_ads sa
       LEFT JOIN bank_accounts ba ON sa.bank_account_id = ba.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC`,
      [req.user!.userId]
    );

    res.json({ ads: result.rows });
  } catch (error) {
    logger.error('Get ads error:', error);
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// Create sell ad
router.post('/', [
  authenticate,
  body('amountTotalUsdt').isFloat({ min: 10 }),
  body('bankAccountId').isUUID(),
  body('startActive').isBoolean(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bankAccountId, startActive } = req.body;
    const rawAmount = parseFloat(req.body.amountTotalUsdt);

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (rawAmount < 10) {
      return res.status(400).json({ error: 'Minimum amount is 10 USDT' });
    }
    if (rawAmount > 1_000_000) {
      return res.status(400).json({ error: 'Amount exceeds maximum limit' });
    }

    // Authoritative 6dp round — single source of truth for the entire transaction
    const amountTotalUsdt = Math.round(rawAmount * 1e6) / 1e6;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const bankResult = await client.query(
        'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
        [bankAccountId, req.user!.userId]
      );

      if (bankResult.rows.length === 0) {
        throw new Error('Bank account not found');
      }

      // Row-level lock prevents concurrent ad creation from double-spending
      const walletResult = await client.query(
        'SELECT available_usdt FROM wallets WHERE user_id = $1 FOR UPDATE',
        [req.user!.userId]
      );

      const availableUsdt = parseFloat(walletResult.rows[0].available_usdt);

      if (availableUsdt < amountTotalUsdt) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      if (startActive) {
        await client.query(
          `UPDATE wallets 
           SET available_usdt = available_usdt - ROUND($1::numeric, 6),
               locked_usdt = locked_usdt + ROUND($1::numeric, 6)
           WHERE user_id = $2`,
          [amountTotalUsdt, req.user!.userId]
        );
      }

      const adResult = await client.query(
        `INSERT INTO sell_ads (user_id, bank_account_id, amount_total_usdt, 
                                amount_remaining_usdt, status)
         VALUES ($1, $2, ROUND($3::numeric, 6), ROUND($3::numeric, 6), $4)
         RETURNING *`,
        [req.user!.userId, bankAccountId, amountTotalUsdt, startActive ? 'ACTIVE' : 'PAUSED']
      );

      // Post-transaction integrity check: ensure balance never went negative
      const verifyResult = await client.query(
        'SELECT available_usdt, locked_usdt FROM wallets WHERE user_id = $1',
        [req.user!.userId]
      );
      const postAvailable = parseFloat(verifyResult.rows[0].available_usdt);
      const postLocked = parseFloat(verifyResult.rows[0].locked_usdt);
      if (postAvailable < 0 || postLocked < 0) {
        await client.query('ROLLBACK');
        logger.error(`Balance integrity violation for user ${req.user!.userId}: available=${postAvailable}, locked=${postLocked}`);
        return res.status(500).json({ error: 'Transaction failed — balance integrity check' });
      }

      await client.query('COMMIT');

      io.to(`user_${req.user!.userId}`).emit('wallet_updated');
      io.to(`user_${req.user!.userId}`).emit('ad_created');

      logger.info(`Sell ad created: ${req.user!.userId} - ${amountTotalUsdt} USDT (locked: ${postLocked})`);

      res.status(201).json({
        message: 'Sell ad created',
        ad: adResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Create ad error:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Pause/Resume ad
router.patch('/:id/status', [
  authenticate,
  body('status').isIn(['ACTIVE', 'PAUSED']),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Get ad
      const adResult = await client.query(
        'SELECT * FROM sell_ads WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [id, req.user!.userId]
      );

      if (adResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Ad not found' });
      }

      const ad = adResult.rows[0];
      const currentStatus = ad.status;
      const remainingUsdt = parseFloat(ad.amount_remaining_usdt);

      if (currentStatus === 'COMPLETED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot change status of completed ad' });
      }

      if (currentStatus === status) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Ad is already ${status}` });
      }

      // Lock wallet row to prevent concurrent balance modifications
      const walletResult = await client.query(
        'SELECT available_usdt, locked_usdt FROM wallets WHERE user_id = $1 FOR UPDATE',
        [req.user!.userId]
      );

      if (currentStatus === 'ACTIVE' && status === 'PAUSED') {
        await client.query(
          `UPDATE wallets 
           SET available_usdt = available_usdt + ROUND($1::numeric, 6),
               locked_usdt = locked_usdt - ROUND($1::numeric, 6)
           WHERE user_id = $2`,
          [remainingUsdt, req.user!.userId]
        );
      } else if (currentStatus === 'PAUSED' && status === 'ACTIVE') {
        const availableUsdt = parseFloat(walletResult.rows[0].available_usdt);

        if (availableUsdt < remainingUsdt) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Insufficient balance to resume ad' });
        }

        await client.query(
          `UPDATE wallets 
           SET available_usdt = available_usdt - ROUND($1::numeric, 6),
               locked_usdt = locked_usdt + ROUND($1::numeric, 6)
           WHERE user_id = $2`,
          [remainingUsdt, req.user!.userId]
        );
      }

      await client.query(
        'UPDATE sell_ads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, id]
      );

      // Post-transaction integrity check
      const verifyResult = await client.query(
        'SELECT available_usdt, locked_usdt FROM wallets WHERE user_id = $1',
        [req.user!.userId]
      );
      const postAvailable = parseFloat(verifyResult.rows[0].available_usdt);
      const postLocked = parseFloat(verifyResult.rows[0].locked_usdt);
      if (postAvailable < 0 || postLocked < 0) {
        await client.query('ROLLBACK');
        logger.error(`Balance integrity violation on status change for user ${req.user!.userId}`);
        return res.status(500).json({ error: 'Transaction failed — balance integrity check' });
      }

      await client.query('COMMIT');

      // Emit real-time updates
      io.to(`user_${req.user!.userId}`).emit('wallet_updated');
      io.to(`user_${req.user!.userId}`).emit('ad_updated');

      res.json({ message: 'Ad status updated' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update ad status error:', error);
    res.status(500).json({ error: 'Failed to update ad status' });
  }
});

// Request ad edit
router.post('/:id/edit-request', [
  authenticate,
  body('requestedChanges').isObject(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requestedChanges } = req.body;

    // Verify ad belongs to user
    const adResult = await db.query(
      'SELECT id FROM sell_ads WHERE id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );

    if (adResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Create edit request
    const result = await db.query(
      `INSERT INTO ad_edit_requests (user_id, ad_id, requested_changes)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [req.user!.userId, id, JSON.stringify(requestedChanges)]
    );

    logger.info(`Ad edit request created: ${id}`);

    res.status(201).json({
      message: 'Edit request submitted',
      request: result.rows[0],
    });
  } catch (error) {
    logger.error('Create edit request error:', error);
    res.status(500).json({ error: 'Failed to create edit request' });
  }
});

// Request ad deletion
router.post('/:id/delete-request', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ad belongs to user
    const adResult = await db.query(
      'SELECT id FROM sell_ads WHERE id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );

    if (adResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Create delete request
    const result = await db.query(
      `INSERT INTO ad_delete_requests (user_id, ad_id)
       VALUES ($1, $2)
       RETURNING id, created_at`,
      [req.user!.userId, id]
    );

    logger.info(`Ad delete request created: ${id}`);

    res.status(201).json({
      message: 'Delete request submitted',
      request: result.rows[0],
    });
  } catch (error) {
    logger.error('Create delete request error:', error);
    res.status(500).json({ error: 'Failed to create delete request' });
  }
});

export default router;
