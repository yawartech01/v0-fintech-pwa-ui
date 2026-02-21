# VELTOX Backend API

Production-ready backend API for VELTOX fintech platform.

## Features

- ✅ RESTful API with Express.js
- ✅ PostgreSQL database with proper schema
- ✅ Real-time updates with WebSocket (Socket.io)
- ✅ JWT authentication (users + admin)
- ✅ TRC20 USDT integration (TronWeb)
- ✅ File uploads (payment receipts)
- ✅ Rate limiting & security (Helmet)
- ✅ Comprehensive logging (Winston)
- ✅ Input validation
- ✅ Error handling
- ✅ Automated deposit monitoring
- ✅ Sweep threshold logic

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL Database
```bash
# Install PostgreSQL (if not installed)
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE veltox_db;
CREATE USER veltox_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE veltox_db TO veltox_user;
\q
```

### 3. Run Database Migration
```bash
psql -U veltox_user -d veltox_db -f src/database/schema.sql
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Start Production Server
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Create user account
- POST `/api/auth/login` - User login
- POST `/api/auth/admin/login` - Admin login
- POST `/api/auth/logout` - Logout

### Users
- GET `/api/users/me` - Get current user
- PUT `/api/users/me` - Update user profile
- GET `/api/users/:id` - Get user by ID (admin)

### Wallet
- GET `/api/wallet` - Get user wallet
- GET `/api/wallet/deposit-address` - Get deposit address
- GET `/api/wallet/deposits` - Get deposit history
- POST `/api/wallet/withdraw` - Request withdrawal
- GET `/api/wallet/withdrawals` - Get withdrawal history

### Sell Ads
- GET `/api/ads` - List user's sell ads
- POST `/api/ads` - Create sell ad
- PATCH `/api/ads/:id` - Update sell ad
- POST `/api/ads/:id/edit-request` - Request edit
- POST `/api/ads/:id/delete-request` - Request delete

### Bank Accounts
- GET `/api/bank-accounts` - List user's bank accounts
- POST `/api/bank-accounts` - Add bank account
- PUT `/api/bank-accounts/:id` - Update bank account
- DELETE `/api/bank-accounts/:id` - Delete bank account
- PATCH `/api/bank-accounts/:id/set-default` - Set as default

### Admin
- GET `/api/admin/stats` - Platform statistics
- GET `/api/admin/users` - List all users
- POST `/api/admin/users/:id/ban` - Ban user
- POST `/api/admin/users/:id/unban` - Unban user
- POST `/api/admin/users/:id/adjust-balance` - Adjust balance
- GET `/api/admin/withdrawals` - List withdrawal requests
- POST `/api/admin/withdrawals/:id/approve` - Approve withdrawal
- POST `/api/admin/withdrawals/:id/reject` - Reject withdrawal
- GET `/api/admin/ads` - List all sell ads
- POST `/api/admin/ads/:id/complete` - Mark ad as complete
- POST `/api/admin/ads/:id/upload-receipt` - Upload payment receipt
- GET `/api/admin/ad-requests` - List ad edit/delete requests
- POST `/api/admin/ad-requests/:id/approve` - Approve request
- POST `/api/admin/ad-requests/:id/reject` - Reject request
- GET `/api/admin/settings` - Get platform settings
- PUT `/api/admin/settings` - Update platform settings
- GET `/api/admin/audit-log` - Get audit log

## WebSocket Events

### Client -> Server
- `join_room` - Join user's private room
- `refresh_data` - Request data refresh

### Server -> Client
- `wallet_updated` - Wallet balance changed
- `deposit_confirmed` - New deposit confirmed
- `withdrawal_updated` - Withdrawal status changed
- `ad_updated` - Sell ad updated
- `banner_updated` - Admin banner changed
- `rate_updated` - Exchange rate changed

## Security

- JWT tokens with expiration
- Password hashing with bcrypt
- Rate limiting (100 req/15min)
- Helmet for HTTP headers
- Input validation
- SQL injection protection (parameterized queries)
- File upload validation
- CORS configuration

## Monitoring

- Winston logging (error.log, combined.log)
- Request logging with Morgan
- Database connection pooling
- Error tracking ready for Sentry

## Production Deployment

1. Set NODE_ENV=production
2. Use proper JWT secrets
3. Configure PostgreSQL with backups
4. Set up HTTPS/SSL
5. Configure firewall
6. Set up monitoring (PM2, Datadog, etc.)
7. Configure Tron API key
8. Set up automated backups
