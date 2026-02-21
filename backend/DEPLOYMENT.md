# VELTOX Backend Deployment Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+
- Domain with SSL certificate
- Server with 2GB+ RAM

## Step-by-Step Deployment

### 1. Server Setup (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE veltox_db;
CREATE USER veltox_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE veltox_db TO veltox_user;
ALTER DATABASE veltox_db OWNER TO veltox_user;
\q

# Run migrations
psql -U veltox_user -d veltox_db -f src/database/schema.sql
```

### 3. Application Setup

```bash
# Clone or upload your code
cd /var/www/
git clone your-repo veltox-backend
cd veltox-backend

# Install dependencies
npm install --production

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your values

# Build TypeScript
npm run build

# Create logs directory
mkdir -p logs

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

### 4. Environment Configuration

Edit `.env` with production values:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=veltox_db
DB_USER=veltox_user
DB_PASSWORD=your_secure_db_password

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_ADMIN_SECRET=your_admin_jwt_secret_min_32_chars

# Admin
ADMIN_PASSWORD=your_very_secure_admin_password

# TronGrid (get from https://www.trongrid.io/)
TRON_API_KEY=your_trongrid_api_key
TRON_FULL_NODE=https://api.trongrid.io
TRON_COMPANY_WALLET=TYourCompanyWalletAddress
TRON_COMPANY_PRIVATE_KEY=your_private_key

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 5. Start with PM2

```bash
# Start application
pm2 start dist/server.js --name veltox-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command output instructions

# Monitor
pm2 status
pm2 logs veltox-api
pm2 monit
```

### 6. Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/veltox-api
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/veltox-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### 8. Firewall Setup

```bash
# UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9. Database Backup Setup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-veltox-db.sh
```

Add this script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/veltox"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U veltox_user -h localhost veltox_db | gzip > $BACKUP_DIR/veltox_db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "veltox_db_*.sql.gz" -mtime +7 -delete
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-veltox-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-veltox-db.sh
```

### 10. Monitoring Setup

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# System monitoring
sudo apt install -y htop

# Optional: Install Datadog/New Relic agent
```

## Post-Deployment Checks

```bash
# Check API health
curl https://api.yourdomain.com/health

# Check logs
pm2 logs veltox-api --lines 50

# Monitor resources
pm2 monit

# Check database connections
psql -U veltox_user -d veltox_db -c "SELECT count(*) FROM users;"
```

## Maintenance Commands

```bash
# Restart API
pm2 restart veltox-api

# View logs
pm2 logs veltox-api

# Stop API
pm2 stop veltox-api

# Update code
cd /var/www/veltox-backend
git pull
npm install
npm run build
pm2 restart veltox-api

# Database backup manually
/usr/local/bin/backup-veltox-db.sh

# Restore database
gunzip < backup.sql.gz | psql -U veltox_user -d veltox_db
```

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT secrets
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database backups automated
- [ ] PM2 monitoring enabled
- [ ] Log rotation configured
- [ ] Rate limiting enabled
- [ ] Admin password is strong
- [ ] Environment variables secured
- [ ] Private keys encrypted
- [ ] Regular security updates scheduled

## Performance Optimization

```bash
# PostgreSQL tuning
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adjust based on server RAM (example for 4GB):
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Troubleshooting

### API won't start
```bash
pm2 logs veltox-api --err
# Check for port conflicts, database connection issues
```

### Database connection errors
```bash
# Test database connection
psql -U veltox_user -d veltox_db
# Check PostgreSQL is running
sudo systemctl status postgresql
```

### High memory usage
```bash
pm2 monit
# Consider adding swap or upgrading server
```

### WebSocket not working
```bash
# Check Nginx WebSocket configuration
sudo nginx -t
sudo systemctl restart nginx
```

## Production URLs

- API: https://api.yourdomain.com
- Health Check: https://api.yourdomain.com/health
- Admin Panel: https://yourdomain.com/admin (frontend)

