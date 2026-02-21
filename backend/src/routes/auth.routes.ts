import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import db from '../config/database';
import logger from '../config/logger';
import { AuthPayload } from '../types';

const router = Router();

// Generate unique referral code
const generateReferralCode = (): string => {
  return 'VELTOX-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate unique TRC20 address (mock for now, replace with real TronWeb)
const generateDepositAddress = (): string => {
  return 'T' + Math.random().toString(36).substring(2, 35).toUpperCase();
};

// User Signup (phone is optional and not validated)
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('referralCode').optional().trim(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, referralCode } = req.body;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate referral code
    const newReferralCode = generateReferralCode();

    // Start transaction
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Find leader and upline if referral code provided
      let leaderId = null;
      let uplineId = null;
      if (referralCode) {
        const leader = await client.query(
          'SELECT id, leader_id FROM users WHERE referral_code = $1',
          [referralCode]
        );
        if (leader.rows.length > 0) {
          leaderId = leader.rows[0].id;
          uplineId = leader.rows[0].leader_id; // L2 is leader's leader
        }
      }

      // Create user (phone is always null)
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, phone, referral_code, leader_id, upline_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, uid, email, name, phone, referral_code, created_at`,
        [email, passwordHash, name, null, newReferralCode, leaderId, uplineId]
      );

      const user = userResult.rows[0];

      // Create wallet
      await client.query(
        'INSERT INTO wallets (user_id) VALUES ($1)',
        [user.id]
      );

      // Create deposit address
      const depositAddress = generateDepositAddress();
      await client.query(
        'INSERT INTO deposit_addresses (user_id, network, address) VALUES ($1, $2, $3)',
        [user.id, 'TRC20', depositAddress]
      );

      await client.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, uid: user.uid },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email,
          name: user.name,
          phone: user.phone,
          referralCode: user.referral_code,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const result = await db.query(
      'SELECT id, uid, email, name, phone, password_hash, is_banned, ban_reason FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({ 
        error: 'Account banned',
        reason: user.ban_reason 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, uid: user.uid },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Login
router.post('/admin/login', [
  body('password').notEmpty(),
], async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Generate admin JWT token
    const token = jwt.sign(
      { userId: 'admin', email: 'admin@veltox.com', isAdmin: true } as AuthPayload,
      process.env.JWT_ADMIN_SECRET!,
      { expiresIn: '24h' }
    );

    logger.info('Admin logged in');

    res.json({
      message: 'Admin login successful',
      token,
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

export default router;
