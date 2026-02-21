import db from '../config/database';
import logger from '../config/logger';
import { verifyTransaction } from './trongrid.service';

let pollerInterval: NodeJS.Timeout | null = null;
let ioRef: any = null;

const POLL_INTERVAL = 30_000; // 30 seconds

export function startDepositPoller(io: any): void {
  ioRef = io;
  if (pollerInterval) return;

  logger.info('Deposit poller started (every 30s)');

  pollerInterval = setInterval(async () => {
    try {
      await checkPendingDeposits();
    } catch (error) {
      logger.error('Deposit poller error:', error);
    }
  }, POLL_INTERVAL);

  // Run once immediately
  checkPendingDeposits().catch(err => logger.error('Initial deposit poll error:', err));
}

export function stopDepositPoller(): void {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
    logger.info('Deposit poller stopped');
  }
}

async function checkPendingDeposits(): Promise<void> {
  const result = await db.query(
    `SELECT id, user_id, tx_hash, created_at
     FROM deposits
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT 50`
  );

  if (result.rows.length === 0) return;

  logger.info(`Checking ${result.rows.length} pending deposit(s)...`);

  for (const deposit of result.rows) {
    try {
      const txInfo = await verifyTransaction(deposit.tx_hash);

      if (!txInfo) {
        // Check if it's been pending for more than 2 hours — mark as failed
        const ageMs = Date.now() - new Date(deposit.created_at).getTime();
        if (ageMs > 2 * 60 * 60 * 1000) {
          await db.query(
            `UPDATE deposits SET status = 'failed' WHERE id = $1`,
            [deposit.id]
          );
          logger.warn(`Deposit ${deposit.tx_hash} marked failed after 2h timeout`);

          if (ioRef) {
            ioRef.to(`user_${deposit.user_id}`).emit('deposit_failed', {
              txHash: deposit.tx_hash,
            });
          }
        }
        continue;
      }

      if (!txInfo.confirmed) continue;

      // Confirmed — credit wallet
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update deposit
        const updateResult = await client.query(
          `UPDATE deposits
           SET status = 'confirmed',
               amount_usdt = ROUND($1::numeric, 6),
               from_address = $2,
               to_address = $3,
               confirmations = 19,
               confirmed_at = NOW()
           WHERE id = $4 AND status = 'pending'
           RETURNING *`,
          [txInfo.amount, txInfo.from, txInfo.to, deposit.id]
        );

        if (updateResult.rows.length === 0) {
          await client.query('ROLLBACK');
          continue;
        }

        // Credit wallet
        await client.query(
          `UPDATE wallets
           SET available_usdt = available_usdt + ROUND($1::numeric, 6)
           WHERE user_id = $2`,
          [txInfo.amount, deposit.user_id]
        );

        // Notification
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, 'deposit', $2, $3, $4)`,
          [
            deposit.user_id,
            `Deposit Confirmed — ${txInfo.amount.toFixed(2)} USDT`,
            `Your deposit of ${txInfo.amount.toFixed(6)} USDT has been confirmed and credited.`,
            JSON.stringify({ txHash: deposit.tx_hash, amount: txInfo.amount }),
          ]
        );

        await client.query('COMMIT');

        logger.info(`Deposit auto-confirmed: user=${deposit.user_id} amount=${txInfo.amount} tx=${deposit.tx_hash}`);

        if (ioRef) {
          ioRef.to(`user_${deposit.user_id}`).emit('wallet_updated');
          ioRef.to(`user_${deposit.user_id}`).emit('deposit_confirmed', {
            txHash: deposit.tx_hash,
            amount: txInfo.amount,
            status: 'confirmed',
          });
        }
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Failed to credit deposit ${deposit.tx_hash}:`, err);
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error(`Error checking deposit ${deposit.tx_hash}:`, err);
    }

    // Rate limit: brief pause between TronGrid calls
    await new Promise(r => setTimeout(r, 500));
  }
}
