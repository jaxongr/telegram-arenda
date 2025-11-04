# Server Deployment - Tezkor Buyruqlar

Server: **185.207.251.184**

## 1️⃣ SSH ulanish

```bash
ssh root@185.207.251.184
# yoki sizning useringiz bilan
```

## 2️⃣ Bir buyruqda serverga o'rnatish

```bash
curl -sL https://raw.githubusercontent.com/jaxongr/telegram-arenda/main/deploy/setup-server.sh | bash
```

Bu o'rnatadi: Node.js, PostgreSQL, Redis, Nginx, PM2, Git

## 3️⃣ Repositoriyani clone qilish

```bash
cd /var/www
git clone https://github.com/jaxongr/telegram-arenda.git
cd telegram-arenda
```

## 4️⃣ Environment sozlash

### Backend .env:
```bash
cd backend
cp .env.example .env
nano .env
```

**Majburiy o'zgartirish kerak:**
- `TELEGRAM_API_ID` - my.telegram.org dan
- `TELEGRAM_API_HASH` - my.telegram.org dan
- `ADMIN_BOT_TOKEN` - BotFather dan
- `CLIENT_BOT_TOKEN` - BotFather dan
- `ADMIN_TELEGRAM_IDS` - sizning telegram ID
- `DB_PASSWORD` - telegram123 (yoki o'zgartiring)

### Frontend .env:
```bash
cd ../frontend
nano .env
```

```env
VITE_API_URL=http://185.207.251.184/api
```

## 5️⃣ Deploy qilish

```bash
cd /var/www/telegram-arenda/deploy
chmod +x deploy.sh
./deploy.sh
```

## 6️⃣ Tekshirish

```bash
# Backend status
pm2 status

# Logs
pm2 logs telegram-backend

# Browser da:
http://185.207.251.184
```

---

## ⚡ Tezkor Buyruqlar

### Status tekshirish:
```bash
pm2 status                           # Backend status
sudo systemctl status nginx          # Nginx status
sudo systemctl status postgresql     # Database status
sudo systemctl status redis-server   # Redis status
```

### Logs:
```bash
pm2 logs telegram-backend            # Backend logs
pm2 logs --lines 100                 # So'nggi 100 qator
sudo tail -f /var/log/nginx/error.log # Nginx logs
```

### Restart:
```bash
pm2 restart telegram-backend         # Backend restart
sudo systemctl restart nginx         # Nginx restart
sudo systemctl restart postgresql    # PostgreSQL restart
```

### Update (GitHub dan):
```bash
cd /var/www/telegram-arenda
git pull origin main
cd deploy
./deploy.sh
```

---

## 🔧 Muammolarni hal qilish

### Backend ishlamasa:
```bash
pm2 logs telegram-backend --lines 50
cd /var/www/telegram-arenda/backend
cat .env  # Environment tekshirish
```

### Database xato:
```bash
sudo -u postgres psql
\l  # Databaselar ro'yxati
\c telegram_rental  # Database ga ulanish
\dt  # Tablelar
\q  # Chiqish
```

### Redis xato:
```bash
redis-cli ping  # PONG qaytishi kerak
sudo systemctl restart redis-server
```

### Port band:
```bash
sudo lsof -i :3000  # 3000 port kim ishlatyapti
sudo lsof -i :80    # 80 port kim ishlatyapti
```

---

## 📊 Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# System resources
htop

# Disk
df -h

# Memory
free -h

# Network
netstat -tulpn | grep LISTEN
```

---

## 🔐 Security (Keyin)

### Firewall:
```bash
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL (Domain bor bo'lsa):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 💾 Backup

### Database backup:
```bash
# Backup
cd /var/www/telegram-arenda
pg_dump -U telegram -h localhost telegram_rental > backup_$(date +%Y%m%d).sql

# Restore
psql -U telegram -h localhost telegram_rental < backup_20250104.sql
```

### Code backup:
```bash
cd /var/www
tar -czf telegram-arenda-backup-$(date +%Y%m%d).tar.gz telegram-arenda/
```

---

## 🚀 Tayyor!

Brauzerda: **http://185.207.251.184**

Telegram botlar:
- Client bot: `/start` - mijozlar uchun
- Admin bot: `/start` - admin uchun

Dashboard login kerak emas, to'g'ridan ochiladi!

---

**Savollar?** `deploy/SERVER_SETUP.md` ga qarang - batafsil yo'riqnoma!
