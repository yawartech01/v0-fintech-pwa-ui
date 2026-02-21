# VELTOX Backend - Quick Start Guide

## ⚡ Quick Installation (5 Minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Ubuntu/Debian Linux (or similar)

### Option 1: Automated Installation

```bash
cd backend
chmod +x install.sh
./install.sh
```

The script will:
- ✅ Install Node.js dependencies
- ✅ Create necessary directories
- ✅ Set up PostgreSQL database
- ✅ Run database migrations
- ✅ Configure environment variables
- ✅ Build TypeScript

### Option 2: Manual Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE veltox_db;
CREATE USER veltox_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE veltox_db TO veltox_user;
\q

# 3. Run migrations
psql -U veltox_user -d veltox_db -f src/database/schema.sql

# 4. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 5. Build TypeScript
npm run build
```

---

## 🔧 Configuration

Edit `.env` file:

```env
# REQUIRED - Generate with: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_min_32_characters
JWT_ADMIN_SECRET=your_admin_jwt_secret_min_32_characters
ADMIN_PASSWORD=your_secure_admin_password

# REQUIRED - Database
DB_PASSWORD=your_database_password

# OPTIONAL - TronGrid API (for real blockchain)
TRON_API_KEY=your_trongrid_api_key
TRON_COMPANY_WALLET=your_trc20_wallet_address
```

---

## 🚀 Running the Backend

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### With PM2 (recommended for production)
```bash
npm install -g pm2
pm2 start dist/server.js --name veltox-api
pm2 save
pm2 startup
```

---

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Create Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your_admin_password"}'
```

### Create User Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'
```

---

## 📊 Database Management

### Backup Database
```bash
pg_dump -U veltox_user veltox_db > backup.sql
```

### Restore Database
```bash
psql -U veltox_user -d veltox_db < backup.sql
```

### View Database Tables
```bash
psql -U veltox_user -d veltox_db
\dt  # List tables
SELECT * FROM users LIMIT 5;
```

---

## 🔍 Monitoring

### View Logs
```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# PM2 logs
pm2 logs veltox-api
```

### Check Status
```bash
pm2 status
pm2 monit
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Restart if needed
sudo systemctl restart postgresql
```

### Permission Errors
```bash
# Fix upload directory permissions
chmod 755 uploads/
# Fix log directory permissions
chmod 755 logs/
```

---

## 📚 API Documentation

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - User login
- `POST /auth/admin/login` - Admin login

### Wallet
- `GET /wallet` - Get balance
- `POST /wallet/withdraw` - Request withdrawal
- `GET /wallet/deposits` - Deposit history

### Sell Ads
- `GET /ads` - List ads
- `POST /ads` - Create ad
- `PATCH /ads/:id/status` - Pause/Resume

### Admin (requires admin token)
- `GET /admin/stats` - Dashboard stats
- `GET /admin/users` - All users
- `GET /admin/withdrawals` - Withdrawal requests
- `POST /admin/withdrawals/:id/approve` - Approve
- `GET /admin/ads` - All sell ads
- `POST /admin/ads/:id/complete` - Mark complete

Full API documentation: See `README.md`

---

## 🔗 Integration with Frontend

Update frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

Replace localStorage calls with API calls:
```typescript
// Before (localStorage)
const user = localStorage.getItem('user');

// After (API)
const response = await fetch('http://localhost:5000/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const user = await response.json();
```

---

## 🎯 Production Deployment

See `DEPLOYMENT.md` for complete production setup including:
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)
- PM2 process management
- Database backups
- Security hardening
- Monitoring setup

---

## 💡 Tips

- Use strong JWT secrets (32+ characters)
- Change admin password regularly
- Enable database backups
- Monitor logs daily
- Keep dependencies updated
- Use HTTPS in production
- Set up rate limiting
- Enable firewall

---

## 🆘 Getting Help

- Check logs: `logs/error.log`
- Check database: `psql -U veltox_user -d veltox_db`
- Check PM2: `pm2 logs veltox-api`
- Check network: `netstat -tuln | grep 5000`

---

**🎉 You're ready to go! Start the backend and connect your frontend.**
