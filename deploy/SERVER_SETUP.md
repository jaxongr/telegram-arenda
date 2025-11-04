# Server Deployment Guide

Server: **185.207.251.184**

## Step 1: Server ga ulanish

```bash
ssh root@185.207.251.184
# yoki
ssh your_user@185.207.251.184
```

## Step 2: Setup scriptni yuklab olish va ishga tushirish

```bash
# Temporary directory yaratish
mkdir -p /tmp/telegram-setup
cd /tmp/telegram-setup

# Setup scriptni yuklab olish
curl -O https://raw.githubusercontent.com/jaxongr/telegram-arenda/main/deploy/setup-server.sh

# Executable qilish
chmod +x setup-server.sh

# Ishga tushirish
./setup-server.sh
```

Bu script o'rnatadi:
- ✅ Node.js 20.x
- ✅ PostgreSQL 14
- ✅ Redis
- ✅ Nginx
- ✅ PM2
- ✅ Git

## Step 3: Repositoriyani clone qilish

```bash
cd /var/www
sudo git clone https://github.com/jaxongr/telegram-arenda.git telegram-arenda
sudo chown -R $USER:$USER telegram-arenda
cd telegram-arenda
```

## Step 4: Backend .env sozlash

```bash
cd /var/www/telegram-arenda/backend
cp .env.example .env
nano .env
```

Quyidagilarni to'ldiring:
```env
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telegram_rental
DB_USER=telegram
DB_PASSWORD=telegram123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram API (my.telegram.org dan oling)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Bot tokens (BotFather dan oling)
ADMIN_BOT_TOKEN=your_admin_bot_token
CLIENT_BOT_TOKEN=your_client_bot_token
ADMIN_TELEGRAM_IDS=your_telegram_id

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Paths
SESSION_PATH=./sessions

# Queue
QUEUE_CONCURRENCY=10
MESSAGE_DELAY_MS=5000
GROUPS_PER_BATCH=10
HEALTH_CHECK_INTERVAL_MS=300000

# Frontend
FRONTEND_URL=http://185.207.251.184
```

CTRL+X, Y, Enter (saqlash)

## Step 5: Frontend .env sozlash

```bash
cd /var/www/telegram-arenda/frontend
nano .env
```

```env
VITE_API_URL=http://185.207.251.184/api
```

CTRL+X, Y, Enter

## Step 6: Deploy qilish

```bash
cd /var/www/telegram-arenda/deploy
chmod +x deploy.sh
./deploy.sh
```

Bu script:
- ✅ Dependencies o'rnatadi
- ✅ Backend build qiladi
- ✅ Frontend build qiladi
- ✅ PM2 bilan backend ishga tushiradi
- ✅ Nginx sozlaydi

## Step 7: Tekshirish

```bash
# Backend status
pm2 status

# Backend logs
pm2 logs telegram-backend

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql

# Redis status
sudo systemctl status redis-server
```

## Step 8: Application ochish

Browser da: http://185.207.251.184

## Troubleshooting

### Backend ishlamasa:

```bash
# Loglarni ko'rish
pm2 logs telegram-backend --lines 100

# Restart qilish
pm2 restart telegram-backend

# Environment tekshirish
cd /var/www/telegram-arenda/backend
cat .env
```

### Database connection xato:

```bash
# PostgreSQL ishga tushirish
sudo systemctl start postgresql

# Test connection
psql -U telegram -d telegram_rental -h localhost

# Database qayta yaratish
sudo -u postgres psql
DROP DATABASE IF EXISTS telegram_rental;
CREATE DATABASE telegram_rental OWNER telegram;
\q
```

### Redis connection xato:

```bash
# Redis restart
sudo systemctl restart redis-server

# Test connection
redis-cli ping
```

### Nginx xato:

```bash
# Configuration test
sudo nginx -t

# Restart
sudo systemctl restart nginx

# Logs
sudo tail -f /var/log/nginx/error.log
```

### Frontend ochilmasa:

```bash
# Frontend build qayta qilish
cd /var/www/telegram-arenda/frontend
npm run build

# Nginx restart
sudo systemctl restart nginx
```

## Updates (Yangilanish)

Yangi kod GitHub ga push qilganingizdan keyin:

```bash
cd /var/www/telegram-arenda/deploy
./deploy.sh
```

## Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# System resources
htop

# Disk space
df -h

# Memory usage
free -h
```

## Security (Keyin)

SSL sozlash (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Firewall:
```bash
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Backup

Database backup:
```bash
# Backup
pg_dump -U telegram -h localhost telegram_rental > backup_$(date +%Y%m%d).sql

# Restore
psql -U telegram -h localhost telegram_rental < backup_20250104.sql
```

---

**Muvaffaqiyatli deployment! 🚀**
