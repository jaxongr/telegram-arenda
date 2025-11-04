# 🚀 START HERE - Telegram Session Rental Platform

## Loyiha nima?

**Professional Telegram session arenda platformasi** - logistika dispetcherlari uchun mo'ljallangan.

### Asosiy imkoniyatlar:
- 🔥 1000+ Telegram sessionlarni bir vaqtda boshqarish
- 📨 250+ guruhga avtomatik xabar tarqatish
- 🛡️ Spam/ban detektorli avtomatik session almashtirish
- 📊 Real-time monitoring dashboard
- 💰 To'lov va obuna tizimi
- 🤖 2ta bot: mijozlar va adminlar uchun

---

## ⚡ Tezkor Boshlash (5 daqiqa)

### 1️⃣ Kerakli dasturlar o'rnating:
- **PostgreSQL**: https://www.postgresql.org/download/windows/
- **Redis (Memurai)**: https://www.memurai.com/
- **Node.js** - allaqachon o'rnatilgan ✅

### 2️⃣ Telegram sozlamalari:
1. **API Credentials**: https://my.telegram.org → API development tools
2. **Botlar**: @BotFather ga `/newbot` (2 marta - client va admin)
3. **Admin ID**: @userinfobot ga `/start`

### 3️⃣ Environment sozlash:
```bash
# backend/.env faylini ochish va to'ldirish:
TELEGRAM_API_ID=...
TELEGRAM_API_HASH=...
ADMIN_BOT_TOKEN=...
CLIENT_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=...
```

### 4️⃣ Database yaratish:
```bash
psql -U postgres
CREATE DATABASE telegram_rental;
\q
```

### 5️⃣ Ishga tushirish:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6️⃣ Ochish:
- **Dashboard**: http://localhost:5173
- **Client Bot**: Telegram da botingizga `/start`
- **Admin Bot**: Admin botingizga `/start`

---

## 📚 Dokumentatsiya

Batafsil ma'lumot uchun:

1. **QUICK_START.md** - Tezkor yo'riqnoma
2. **SETUP.md** - Batafsil sozlash
3. **CHECKLIST.md** - Tekshirish ro'yxati
4. **README.md** - Texnik dokumentatsiya

---

## 📁 Loyiha Strukturasi

```
telegram-arend/
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── config/       # Config fayllar
│   │   ├── models/       # Database modellari
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── bots/         # Telegram botlar
│   │   └── index.ts      # Entry point
│   ├── logs/             # Log fayllar
│   ├── sessions/         # Session fayllar
│   └── .env              # Environment variables
│
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── pages/       # Sahifalar
│   │   └── App.tsx      # Main app
│   └── .env             # Frontend config
│
└── README.md            # Bu fayl
```

---

## 🎯 Birinchi Test

### Admin orqali session qo'shish:
1. Admin bot: `/start`
2. "➕ Session qo'shish"
3. Telefon: `+998901234567`
4. Telegram kodini kiriting
5. ✅ Session qo'shildi va 250 guruh yuklandi!

### Mijoz orqali e'lon yuborish:
1. Client bot: `/start`
2. "📦 Arenda olish" → tarif tanlash
3. To'lov chekini yuborish
4. Admin tasdiqlaydi
5. "💬 E'lon yuborish" → xabar yozish
6. ✅ 250 guruhga avtomatik tarqatiladi!

---

## 🔧 Muammolar

### Backend ishlamasa:
```bash
# PostgreSQL va Redis tekshirish
services.msc

# Console da xatolarni o'qing
cd backend
npm run dev
```

### Botlar javob bermasa:
- .env da tokenlar to'g'rimi?
- Backend console da xato bormi?
- @BotFather da bot aktivmi?

### Frontend ochilmasa:
- Backend ishlayaptimi? (port 3000)
- Browser console da xato bormi?

---

## 🌟 Key Features

### Avtomatik Session Replacement
Session spam/ban bo'lsa:
- Avtomatik yangi session topiladi
- Mijozning obunasi yangilanadi
- Ish to'xtamaydi! ✅

### Smart Rate Limiting
- 10 guruh / 5 sekund
- Telegram limitlariga to'liq mos
- Spam detection va handling

### Group Validation
- Cheklangan guruhlarni skip qiladi
- Delete botlar mavjud guruhlarni o'tkazib yuboradi
- Faqat healthy guruhlarga yuboradi

### Real-time Monitoring
- Live statistika dashboard
- Message progress tracking
- Session health monitoring

---

## 💡 Production uchun

Production ga chiqishdan oldin:
1. .env parollarini o'zgartiring
2. HTTPS sozlang
3. Database backup tizimini o'rnating
4. Monitoring qo'shing (Sentry, LogRocket)
5. Rate limiting sozlang
6. Security audit o'tkazing

---

## 📞 Yordam

Savol yoki muammo bo'lsa:
- SETUP.md - batafsil yo'riqnoma
- CHECKLIST.md - tekshirish ro'yxati
- README.md - texnik dokumentatsiya

---

## 🎉 Tayyor!

Barcha sozlamalarni to'ldirib, ishga tushirishdan oldin **CHECKLIST.md** ni tekshiring!

**Omad! 🚀**
