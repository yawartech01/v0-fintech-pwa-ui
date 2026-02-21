#!/bin/bash

# VELTOX Backend Installation Script
# Run this script to set up the complete backend

set -e

echo "🚀 VELTOX Backend Installation Starting..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL 14+ first."
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration!"
else
    echo "✅ .env file already exists"
fi

# Ask for database setup
echo ""
read -p "Do you want to set up the PostgreSQL database? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Setting up database..."
    
    read -p "Enter PostgreSQL superuser name (default: postgres): " PG_USER
    PG_USER=${PG_USER:-postgres}
    
    read -p "Enter database name (default: veltox_db): " DB_NAME
    DB_NAME=${DB_NAME:-veltox_db}
    
    read -p "Enter database user (default: veltox_user): " DB_USER
    DB_USER=${DB_USER:-veltox_user}
    
    read -s -p "Enter database password: " DB_PASS
    echo ""
    
    # Create database and user
    sudo -u $PG_USER psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\q
EOF
    
    echo "✅ Database created"
    
    # Run migrations
    echo "📊 Running database migrations..."
    PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -f src/database/schema.sql
    
    echo "✅ Database schema created"
    
    # Update .env file
    sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
    sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
    
    echo "✅ .env updated with database credentials"
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Installation Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Edit .env file with your configuration"
echo "   2. Generate JWT secrets: openssl rand -base64 32"
echo "   3. Set ADMIN_PASSWORD in .env"
echo "   4. Get TronGrid API key from https://www.trongrid.io/"
echo "   5. Start development: npm run dev"
echo "   6. Or start production: npm start"
echo ""
echo "📚 Documentation:"
echo "   - README.md - General information"
echo "   - DEPLOYMENT.md - Production deployment guide"
echo "   - BACKEND-COMPLETE-SUMMARY.md - Feature summary"
echo ""
echo "🎉 Happy coding!"
