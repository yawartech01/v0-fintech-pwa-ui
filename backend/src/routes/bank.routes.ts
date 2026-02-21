import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import db from '../config/database';
import logger from '../config/logger';

const router = Router();

// Get all bank accounts for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, bank_name, account_holder_name, account_number, 
              ifsc_code, label, is_default, created_at
       FROM bank_accounts 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [req.user!.userId]
    );

    res.json({ bankAccounts: result.rows });
  } catch (error) {
    logger.error('Get bank accounts error:', error);
    res.status(500).json({ error: 'Failed to get bank accounts' });
  }
});

// Add bank account
router.post('/', [
  authenticate,
  body('bankName').trim().notEmpty(),
  body('accountHolderName').trim().notEmpty(),
  body('accountNumber').trim().isLength({ min: 8, max: 18 }),
  body('ifscCode').trim().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  body('label').optional().trim(),
  body('isDefault').optional().isBoolean(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bankName, accountHolderName, accountNumber, ifscCode, label, isDefault } = req.body;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // If setting as default, unset other defaults
      if (isDefault) {
        await client.query(
          'UPDATE bank_accounts SET is_default = false WHERE user_id = $1',
          [req.user!.userId]
        );
      }

      // Insert new bank account
      const result = await client.query(
        `INSERT INTO bank_accounts 
         (user_id, bank_name, account_holder_name, account_number, ifsc_code, label, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user!.userId, bankName, accountHolderName, accountNumber, ifscCode, label || null, isDefault || false]
      );

      await client.query('COMMIT');

      logger.info(`Bank account added: ${req.user!.userId}`);

      res.status(201).json({
        message: 'Bank account added',
        bankAccount: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Add bank account error:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// Update bank account
router.put('/:id', [
  authenticate,
  body('bankName').optional().trim().notEmpty(),
  body('accountHolderName').optional().trim().notEmpty(),
  body('ifscCode').optional().trim().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  body('label').optional().trim(),
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const checkResult = await db.query(
      'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
      [id, req.user!.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.bankName) {
      fields.push(`bank_name = $${paramIndex++}`);
      values.push(updates.bankName);
    }
    if (updates.accountHolderName) {
      fields.push(`account_holder_name = $${paramIndex++}`);
      values.push(updates.accountHolderName);
    }
    if (updates.ifscCode) {
      fields.push(`ifsc_code = $${paramIndex++}`);
      values.push(updates.ifscCode);
    }
    if (updates.label !== undefined) {
      fields.push(`label = $${paramIndex++}`);
      values.push(updates.label);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    await db.query(
      `UPDATE bank_accounts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex}`,
      values
    );

    res.json({ message: 'Bank account updated' });
  } catch (error) {
    logger.error('Update bank account error:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

// Set as default
router.patch('/:id/set-default', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const checkResult = await client.query(
        'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
        [id, req.user!.userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Bank account not found' });
      }

      // Unset all defaults
      await client.query(
        'UPDATE bank_accounts SET is_default = false WHERE user_id = $1',
        [req.user!.userId]
      );

      // Set new default
      await client.query(
        'UPDATE bank_accounts SET is_default = true WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');

      res.json({ message: 'Default bank account updated' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Set default bank account error:', error);
    res.status(500).json({ error: 'Failed to set default' });
  }
});

// Delete bank account
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if account is used in any ads
    const adsResult = await db.query(
      'SELECT id FROM sell_ads WHERE bank_account_id = $1 AND user_id = $2 AND status != $3',
      [id, req.user!.userId, 'COMPLETED']
    );

    if (adsResult.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete bank account with active/paused ads' 
      });
    }

    // Delete
    const result = await db.query(
      'DELETE FROM bank_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    res.json({ message: 'Bank account deleted' });
  } catch (error) {
    logger.error('Delete bank account error:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

export default router;
