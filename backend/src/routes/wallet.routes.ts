import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';
import { io } from '../server';
import { verifyTransaction, isValidTxHash } from '../services/trongrid.service';

const router = Router();

// Get wallet balance
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet: result.rows[0] });
  } catch (error) {
    logger.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

// Get deposit address — returns company's fixed TRC20 address
router.get('/deposit-address', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT key, value FROM platform_settings WHERE key IN ('company_deposit_address','company_deposit_network')`
    );
    const settings: Record<string, string> = {};
    result.rows.forEach((r: any) => { settings[r.key] = r.value; });

    res.json({
      address: settings['company_deposit_address'] || '',
      network: settings['company_deposit_network'] || 'TRC20',
      memo: null,
    });
  } catch (error) {
    logger.error('Get deposit address error:', error);
    res.status(500).json({ error: 'Failed to get deposit address' });
  }
});

// Get deposit history
router.get('/deposits', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, network, amount_usdt, tx_hash, from_address, to_address, 
              status, confirmations, created_at, confirmed_at
       FROM deposits 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user!.userId]
    );

    res.json({ deposits: result.rows });
  } catch (error) {
    logger.error('Get deposits error:', error);
    res.status(500).json({ error: 'Failed to get deposits' });
  }
});

// Submit a deposit — user provides their TxID after sending USDT
router.post('/deposit', [
  authenticate,
  body('txHash').isString().isLength({ min: 64, max: 64 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid transaction hash. Must be 64 hex characters.' });
    }

    const txHash = req.body.txHash.trim().toLowerCase();

    if (!isValidTxHash(txHash)) {
      return res.status(400).json({ error: 'Invalid transaction hash format' });
    }

    // Check if already submitted
    const existing = await db.query(
      'SELECT id, user_id, status FROM deposits WHERE tx_hash = $1',
      [txHash]
    );
    if (existing.rows.length > 0) {
      const dep = existing.rows[0];
      if (dep.user_id === req.user!.userId) {
        return res.json({ message: 'Deposit already submitted', deposit: dep });
      }
      return res.status(400).json({ error: 'This transaction has already been claimed' });
    }

    // Verify on blockchain
    const txInfo = await verifyTransaction(txHash);

    if (!txInfo) {
      // Could be pending — insert as pending and let poller pick it up
      // Use 0.000001 as placeholder — CHECK constraint requires amount_usdt > 0
      // The real amount is updated when the transaction is confirmed on-chain
      await db.query(
        `INSERT INTO deposits (user_id, network, amount_usdt, tx_hash, from_address, to_address, status, confirmations)
         VALUES ($1, 'TRC20', 0.000001, $2, 'pending', 'pending', 'pending', 0)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [req.user!.userId, txHash]
      );

      return res.status(202).json({
        message: 'Transaction submitted. Waiting for blockchain confirmation...',
        status: 'pending',
      });
    }

    if (txInfo.amount <= 0) {
      return res.status(400).json({ error: 'Invalid transaction — zero amount' });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Insert deposit record
      const depositResult = await client.query(
        `INSERT INTO deposits (user_id, network, amount_usdt, tx_hash, from_address, to_address, status, confirmations, confirmed_at)
         VALUES ($1, 'TRC20', ROUND($2::numeric, 6), $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tx_hash) DO UPDATE SET
           status = EXCLUDED.status,
           amount_usdt = EXCLUDED.amount_usdt,
           from_address = EXCLUDED.from_address,
           to_address = EXCLUDED.to_address,
           confirmations = EXCLUDED.confirmations,
           confirmed_at = EXCLUDED.confirmed_at
         RETURNING *`,
        [
          req.user!.userId,
          txInfo.amount,
          txHash,
          txInfo.from,
          txInfo.to,
          txInfo.confirmed ? 'confirmed' : 'pending',
          txInfo.confirmed ? 19 : 0,
          txInfo.confirmed ? new Date() : null,
        ]
      );

      // If confirmed, credit the user's wallet immediately
      if (txInfo.confirmed) {
        await client.query(
          `UPDATE wallets
           SET available_usdt = available_usdt + ROUND($1::numeric, 6)
           WHERE user_id = $2`,
          [txInfo.amount, req.user!.userId]
        );

        // Create notification
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, 'deposit', $2, $3, $4)`,
          [
            req.user!.userId,
            `Deposit Confirmed — ${txInfo.amount.toFixed(2)} USDT`,
            `Your deposit of ${txInfo.amount.toFixed(6)} USDT has been confirmed and credited to your wallet.`,
            JSON.stringify({ txHash, amount: txInfo.amount }),
          ]
        );
      }

      await client.query('COMMIT');

      io.to(`user_${req.user!.userId}`).emit('wallet_updated');
      io.to(`user_${req.user!.userId}`).emit('deposit_confirmed', {
        txHash,
        amount: txInfo.amount,
        status: txInfo.confirmed ? 'confirmed' : 'pending',
      });

      logger.info(`Deposit ${txInfo.confirmed ? 'confirmed' : 'pending'}: ${req.user!.userId} - ${txInfo.amount} USDT - ${txHash}`);

      res.status(201).json({
        message: txInfo.confirmed ? 'Deposit confirmed and credited!' : 'Deposit found, waiting for confirmation...',
        deposit: depositResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'This transaction has already been submitted' });
    }
    logger.error('Submit deposit error:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

// Check status of a pending deposit
router.get('/deposit/:txHash/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { txHash } = req.params;

    const result = await db.query(
      'SELECT * FROM deposits WHERE tx_hash = $1 AND user_id = $2',
      [txHash.toLowerCase(), req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const deposit = result.rows[0];

    // If still pending, re-check on chain
    if (deposit.status === 'pending') {
      const txInfo = await verifyTransaction(txHash);
      if (txInfo && txInfo.confirmed) {
        const client = await db.connect();
        try {
          await client.query('BEGIN');

          const updateResult = await client.query(
            `UPDATE deposits
             SET status = 'confirmed', amount_usdt = ROUND($1::numeric, 6),
                 from_address = $2, to_address = $3,
                 confirmations = 19, confirmed_at = NOW()
             WHERE tx_hash = $4 AND status = 'pending'
             RETURNING *`,
            [txInfo.amount, txInfo.from, txInfo.to, txHash.toLowerCase()]
          );

          if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            const current = await db.query(
              'SELECT * FROM deposits WHERE tx_hash = $1',
              [txHash.toLowerCase()]
            );
            return res.json({ deposit: current.rows[0] });
          }

          await client.query(
            `UPDATE wallets
             SET available_usdt = available_usdt + ROUND($1::numeric, 6)
             WHERE user_id = $2`,
            [txInfo.amount, req.user!.userId]
          );

          await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, 'deposit', $2, $3, $4)`,
            [
              req.user!.userId,
              `Deposit Confirmed — ${txInfo.amount.toFixed(2)} USDT`,
              `Your deposit of ${txInfo.amount.toFixed(6)} USDT has been confirmed and credited.`,
              JSON.stringify({ txHash, amount: txInfo.amount }),
            ]
          );

          await client.query('COMMIT');

          io.to(`user_${req.user!.userId}`).emit('wallet_updated');
          io.to(`user_${req.user!.userId}`).emit('deposit_confirmed', {
            txHash,
            amount: txInfo.amount,
            status: 'confirmed',
          });

          logger.info(`Pending deposit now confirmed: ${req.user!.userId} - ${txInfo.amount} USDT`);

          return res.json({ deposit: updateResult.rows[0] });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    res.json({ deposit });
  } catch (error) {
    logger.error('Check deposit status error:', error);
    res.status(500).json({ error: 'Failed to check deposit status' });
  }
});

// Request withdrawal
router.post('/withdraw', [
  authenticate,
  body('network').equals('TRC20'),
  body('address').matches(/^T[A-Za-z0-9]{33}$/),
  body('amount').isFloat({ min: 10 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { network, address } = req.body;
    const rawAmount = parseFloat(req.body.amount);

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }
    if (rawAmount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal is 10 USDT' });
    }

    const amount = Math.round(rawAmount * 1e6) / 1e6;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const walletResult = await client.query(
        'SELECT available_usdt FROM wallets WHERE user_id = $1 FOR UPDATE',
        [req.user!.userId]
      );

      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      const availableUsdt = parseFloat(walletResult.rows[0].available_usdt);
      const withdrawalFee = 1.0;
      const totalRequired = amount + withdrawalFee;

      if (availableUsdt < totalRequired) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      await client.query(
        `UPDATE wallets 
         SET available_usdt = available_usdt - ROUND($1::numeric, 6),
             locked_usdt = locked_usdt + ROUND($1::numeric, 6)
         WHERE user_id = $2`,
        [amount, req.user!.userId]
      );

      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (user_id, network, amount_usdt, fee_usdt, address)
         VALUES ($1, $2, ROUND($3::numeric, 6), $4, $5)
         RETURNING id, created_at`,
        [req.user!.userId, network, amount, withdrawalFee, address]
      );

      // Post-transaction integrity check
      const verifyResult = await client.query(
        'SELECT available_usdt, locked_usdt FROM wallets WHERE user_id = $1',
        [req.user!.userId]
      );
      if (parseFloat(verifyResult.rows[0].available_usdt) < 0 || parseFloat(verifyResult.rows[0].locked_usdt) < 0) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Transaction failed — balance integrity check' });
      }

      await client.query('COMMIT');

      // Emit real-time update
      io.to(`user_${req.user!.userId}`).emit('wallet_updated');
      io.to(`user_${req.user!.userId}`).emit('withdrawal_requested');

      logger.info(`Withdrawal requested: ${req.user!.userId} - ${amount} USDT`);

      res.status(201).json({
        message: 'Withdrawal request created',
        withdrawal: withdrawalResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal request' });
  }
});

// Get withdrawal history
router.get('/withdrawals', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, network, amount_usdt, fee_usdt, address, status, 
              tx_hash, rejection_reason, created_at, completed_at
       FROM withdrawals 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user!.userId]
    );

    res.json({ withdrawals: result.rows });
  } catch (error) {
    logger.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

export default router;
