#!/bin/bash

# Telegram Session Rental Platform - Server Setup Script
# Ubuntu 20.04/22.04 LTS

set -e

echo "=========================================="
echo "Telegram Arenda Platform - Server Setup"
echo "=========================================="

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14
echo "📦 Installing PostgreSQL 14..."
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
echo "📦 Installing Redis..."
sudo apt-get install -y redis-server

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install build essentials
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential

# Configure PostgreSQL
echo "🔧 Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER telegram WITH PASSWORD 'telegram123';" || true
sudo -u postgres psql -c "CREATE DATABASE telegram_rental OWNER telegram;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE telegram_rental TO telegram;" || true

# Configure Redis
echo "🔧 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure PostgreSQL to allow connections
echo "🔧 Updating PostgreSQL configuration..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf || true

# Restart PostgreSQL
sudo systemctl restart postgresql

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/telegram-arenda
sudo chown -R $USER:$USER /var/www/telegram-arenda

# Configure Firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable || true

echo ""
echo "✅ Server setup completed!"
echo ""
echo "📋 Installed components:"
echo "  - Node.js $(node --version)"
echo "  - npm $(npm --version)"
echo "  - PostgreSQL 14"
echo "  - Redis Server"
echo "  - Nginx"
echo "  - PM2"
echo ""
echo "📊 PostgreSQL credentials:"
echo "  Database: telegram_rental"
echo "  User: telegram"
echo "  Password: telegram123"
echo ""
echo "🔜 Next steps:"
echo "  1. Clone the repository"
echo "  2. Configure .env files"
echo "  3. Run deploy.sh"
echo ""
