#!/bin/bash

# Telegram Session Rental Platform - Deployment Script

set -e

APP_DIR="/var/www/telegram-arenda"
REPO_URL="https://github.com/jaxongr/telegram-arenda.git"

echo "=========================================="
echo "Deploying Telegram Arenda Platform"
echo "=========================================="

# Clone or pull repository
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Pulling latest changes..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Check if .env files exist
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "⚠️  backend/.env not found!"
    echo "Creating from example..."
    cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
    echo "⚠️  Please edit backend/.env and configure:"
    echo "  - TELEGRAM_API_ID"
    echo "  - TELEGRAM_API_HASH"
    echo "  - ADMIN_BOT_TOKEN"
    echo "  - CLIENT_BOT_TOKEN"
    echo "  - DB_PASSWORD"
    read -p "Press enter when ready..."
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd $APP_DIR/backend
npm install --production

# Build backend
echo "🔨 Building backend..."
npm run build

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd $APP_DIR/frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Create logs and sessions directories
echo "📁 Creating directories..."
mkdir -p $APP_DIR/backend/logs
mkdir -p $APP_DIR/backend/sessions

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 delete telegram-backend 2>/dev/null || true

# Start backend with PM2
echo "🚀 Starting backend..."
cd $APP_DIR/backend
pm2 start npm --name "telegram-backend" -- start
pm2 save

# Configure Nginx for frontend
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/telegram-arenda > /dev/null <<EOF
server {
    listen 80;
    server_name 185.207.251.184;

    # Frontend
    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # WebSocket for Socket.io
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/telegram-arenda /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Setup PM2 startup
echo "⚙️  Setting up PM2 startup..."
pm2 startup systemd -u $USER --hp $HOME
pm2 save

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 Service Status:"
pm2 status
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://185.207.251.184"
echo "  Backend API: http://185.207.251.184/api"
echo ""
echo "📋 Useful commands:"
echo "  View logs: pm2 logs telegram-backend"
echo "  Restart: pm2 restart telegram-backend"
echo "  Stop: pm2 stop telegram-backend"
echo ""
