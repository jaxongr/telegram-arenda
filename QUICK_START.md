# Quick Start - Lokal Test uchun

## 1. Kerakli dasturlar

- ✅ Node.js o'rnatilgan
- ⚠️ PostgreSQL kerak
- ⚠️ Redis kerak
- ⚠️ Telegram API credentials kerak

## 2. PostgreSQL o'rnatish (tezkor)

### Windows:
```bash
# https://www.postgresql.org/download/windows/
# Download va install (parol: postgres)
# Database yaratish:
psql -U postgres
CREATE DATABASE telegram_rental;
\q
```

## 3. Redis o'rnatish

### Eng oson: Memurai (Windows native)
```bash
# https://www.memurai.com/
# Download va install
# Avtomatik service ishga tushadi
```

### Yoki WSL:
```bash
wsl --install
# WSL ichida:
sudo apt install redis-server
sudo service redis-server start
```

## 4. Telegram sozlamalari

### API Credentials:
1. https://my.telegram.org
2. Login → API development tools
3. Create new application
4. Copy: API ID va API Hash

### Bot Tokenlar:
1. Telegram: @BotFather
2. `/newbot` - Client bot
3. `/newbot` - Admin bot (yana yangi)
4. Tokenlarni copy qiling

### Admin ID:
1. @userinfobot ga `/start`
2. ID ni copy qiling

## 5. .env fayllarni to'ldirish

### backend/.env:
```env
# Asosiy o'zgartirish kerak:
TELEGRAM_API_ID=12345678                    # my.telegram.org dan
TELEGRAM_API_HASH=abcd1234efgh5678          # my.telegram.org dan
ADMIN_BOT_TOKEN=123456:ABC-DEF              # BotFather dan
CLIENT_BOT_TOKEN=789012:GHI-JKL             # BotFather dan
ADMIN_TELEGRAM_IDS=123456789                # @userinfobot dan

# Agar PostgreSQL parolingiz boshqa bo'lsa:
DB_PASSWORD=postgres

# Qolganini o'zgartirmasangiz ham bo'ladi
```

### frontend/.env:
```env
VITE_API_URL=http://localhost:3000/api
```

## 6. Ishga tushirish

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Muvaffaqiyatli bo'lsa:
```
✅ Database connection established successfully.
✅ All models synchronized successfully.
✅ Redis connected successfully
✅ Client bot started
✅ Admin bot started
✅ Server running on port 3000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Muvaffaqiyatli bo'lsa:
```
➜  Local:   http://localhost:5173/
```

## 7. Test qilish

1. **Dashboard ochish:** http://localhost:5173
2. **Client bot:** Telegramda botingizga `/start`
3. **Admin bot:** Admin botingizga `/start`

## Xato bo'lsa

### "Cannot connect to PostgreSQL"
```bash
# PostgreSQL service ishga tushirish
# Windows Services (services.msc) da PostgreSQL-x64-XX ni start qiling
```

### "Cannot connect to Redis"
```bash
# Memurai service tekshirish: services.msc
# Yoki WSL: wsl sudo service redis-server start
```

### "Bot not responding"
- .env da tokenlar to'g'ri ekanini tekshiring
- Backend console da error bo'lmasligi kerak
- @BotFather da bot aktiv ekanini tekshiring

## Session qo'shish (test)

1. Admin botda: `/start`
2. "➕ Session qo'shish" tugmasi
3. Telefon raqam: `+998901234567`
4. Telegram kod kiritish
5. ✅ Session qo'shildi!

## Keyingi qadamlar

Batafsil setup: `SETUP.md` ni o'qing

---

**Savollar?** README.md va SETUP.md da ko'proq ma'lumot bor!
