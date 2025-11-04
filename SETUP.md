# Local Development Setup (Windows)

## Boshlash uchun kerakli narsalar

### 1. Node.js o'rnatish
1. https://nodejs.org dan LTS versiyani yuklab oling
2. O'rnating va tekshiring:
```bash
node --version
npm --version
```

### 2. PostgreSQL o'rnatish
1. https://www.postgresql.org/download/windows/ dan yuklab oling
2. O'rnatish:
   - Port: 5432 (default)
   - Username: postgres
   - Password: postgres (yoki o'zingizniki)
3. PgAdmin ochiladi, database yarating:
   - Database name: `telegram_rental`

### 3. Redis o'rnatish (2ta usul)

**Usul 1: Memurai (Windows native)**
1. https://www.memurai.com/get-memurai dan yuklab oling
2. O'rnating va service avtomatik ishga tushadi

**Usul 2: WSL orqali**
```bash
# PowerShell da:
wsl --install

# WSL ichida:
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

### 4. Telegram sozlamalari

**API ID va Hash olish:**
1. https://my.telegram.org ga kiring
2. "API development tools" ga o'ting
3. App yarating va API ID, API Hash ni oling

**Bot tokenlarni olish:**
1. Telegramda @BotFather ga yozing
2. `/newbot` - Client bot uchun
3. `/newbot` - Admin bot uchun (yana yangi bot yarating)
4. Tokenlarni saqlang

**Admin Telegram ID olish:**
1. @userinfobot ga `/start` yuboring
2. Sizning ID raqamingizni ko'rsatadi

## Backend sozlash

```bash
# Backend papkaga o'ting
cd backend

# Dependencies o'rnatish
npm install

# .env faylini to'ldiring (allaqachon yaratilgan)
# Quyidagi qiymatlarni o'zgartiring:
# - TELEGRAM_API_ID
# - TELEGRAM_API_HASH
# - ADMIN_BOT_TOKEN
# - CLIENT_BOT_TOKEN
# - ADMIN_TELEGRAM_IDS
# - DB_PASSWORD (agar boshqacha bo'lsa)
```

## Frontend sozlash

```bash
# Frontend papkaga o'ting
cd ../frontend

# Dependencies o'rnatish
npm install
```

## Database yaratish

```bash
# PostgreSQL ishga tushirilgan bo'lishi kerak

# Windows CMD yoki PowerShell:
# Option 1: PgAdmin orqali
# - PgAdmin ochish
# - Databases -> Create -> Database
# - Name: telegram_rental

# Option 2: psql orqali
psql -U postgres
CREATE DATABASE telegram_rental;
\q
```

## Ishga tushirish

### Terminal 1: Redis (agar WSL ishlatilsa)
```bash
wsl
sudo service redis-server start
# yoki Memurai ishlatilsa, hech narsa qilmaslik kerak
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

Ko'rinishi:
```
✅ Database connection established successfully.
✅ All models synchronized successfully.
✅ Redis connected successfully
🚀 Initializing services...
✅ Session Manager initialized
✅ Message Queue System initialized
🤖 Starting Telegram bots...
✅ Client bot started
✅ Admin bot started
✅ Server running on port 3000
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

Ko'rinishi:
```
VITE v7.x.x ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Tekshirish

1. **Backend API test:**
```bash
curl http://localhost:3000/health
```

2. **Frontend ochish:**
- Brauzerda: http://localhost:5173

3. **Telegram botlarni test qilish:**
- Client bot: Telegram da botingizga `/start` yuboring
- Admin bot: Admin botingizga `/start` yuboring

## Birinchi session qo'shish

1. Admin botda `/start` bosing
2. "➕ Session qo'shish" ni bosing
3. Telefon raqamingizni yuboring: `+998901234567`
4. Telegram dan kelgan kodni kiriting
5. Session qo'shiladi va 250ta guruhingiz yuklanadi

## Muammolarni hal qilish

### Port band bo'lsa:
```bash
# Backend port o'zgartirish (.env):
PORT=3001

# Frontend port o'zgartirish:
npm run dev -- --port 5174
```

### PostgreSQL ulanmasa:
```bash
# Windows Services da PostgreSQL ishga tushirilganini tekshiring
services.msc

# Yoki pg_isready orqali:
pg_isready -U postgres
```

### Redis ulanmasa:
```bash
# Memurai service tekshirish
services.msc

# WSL redis tekshirish:
wsl
sudo service redis-server status
```

### Bot javob bermasa:
- .env da tokenlar to'g'ri ekanini tekshiring
- Backend console da xato bormi tekshiring
- @BotFather da bot faol ekanini tekshiring

### Dependencies o'rnatilmasa:
```bash
# Cache tozalash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Production uchun

Production ga chiqarishdan oldin:
- [ ] .env da barcha `postgres` parollarni o'zgartiring
- [ ] JWT_SECRET ni kuchli qiling
- [ ] NODE_ENV=production qiling
- [ ] Database backup sozlang
- [ ] HTTPS sozlang
- [ ] Rate limiting qo'shing

---

## Qo'shimcha Resurslar

- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Telegram API: https://core.telegram.org/api
- GramJS: https://gram.js.org/

Savollar bo'lsa yozing!
