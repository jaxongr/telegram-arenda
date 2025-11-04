# Pre-Launch Checklist ✅

Ishga tushirishdan oldin tekshiring:

## 1. Software O'rnatilgan
- [ ] Node.js (v18+)
- [ ] PostgreSQL (v14+)
- [ ] Redis (Memurai yoki WSL)
- [ ] Git (optional)

## 2. Database Tayyor
- [ ] PostgreSQL service ishga tushirilgan
- [ ] Database yaratilgan: `telegram_rental`
- [ ] Connection ishlayapti: `psql -U postgres -d telegram_rental`

## 3. Redis Tayyor
- [ ] Redis service ishga tushirilgan
- [ ] Test: `redis-cli ping` → PONG

## 4. Telegram Sozlamalari
- [ ] API ID olindi (my.telegram.org)
- [ ] API Hash olindi (my.telegram.org)
- [ ] Client bot yaratildi (@BotFather)
- [ ] Admin bot yaratildi (@BotFather)
- [ ] Admin Telegram ID olindi (@userinfobot)

## 5. Environment Files
- [ ] `backend/.env` yaratilgan
- [ ] `backend/.env` to'ldirilgan:
  - [ ] TELEGRAM_API_ID
  - [ ] TELEGRAM_API_HASH
  - [ ] ADMIN_BOT_TOKEN
  - [ ] CLIENT_BOT_TOKEN
  - [ ] ADMIN_TELEGRAM_IDS
  - [ ] DB_PASSWORD
- [ ] `frontend/.env` yaratilgan

## 6. Dependencies
- [ ] Backend: `cd backend && npm install`
- [ ] Frontend: `cd frontend && npm install`

## 7. Test Run
- [ ] Backend ishga tushadi: `cd backend && npm run dev`
- [ ] Xatolar yo'q console da
- [ ] "Server running on port 3000" ko'rinadi
- [ ] "Client bot started" ko'rinadi
- [ ] "Admin bot started" ko'rinadi
- [ ] Frontend ishga tushadi: `cd frontend && npm run dev`
- [ ] Dashboard ochiladi: http://localhost:5173

## 8. Functional Tests
- [ ] Client bot `/start` ga javob beradi
- [ ] Admin bot `/start` ga javob beradi
- [ ] Dashboard statistika ko'rsatadi
- [ ] Session qo'shish ishlaydi (admin bot orqali)

## 9. Production Checklist (keyinroq)
- [ ] .env parollar o'zgartirilgan
- [ ] JWT_SECRET kuchli parol
- [ ] HTTPS sozlangan
- [ ] Database backup sozlangan
- [ ] Monitoring sozlangan
- [ ] Error logging sozlangan
- [ ] Rate limiting qo'shilgan
- [ ] CORS to'g'ri sozlangan

---

## Muammolar

### Backend ishlamasa:
1. Console da xato bor-yo'qligini o'qing
2. PostgreSQL ishga tushganini tekshiring
3. Redis ishga tushganini tekshiring
4. .env fayllar to'g'ri ekanini tekshiring

### Bot javob bermasa:
1. Backend console da xato bor-yo'qligini tekshiring
2. Bot tokenlari to'g'ri ekanini tekshiring
3. @BotFather da bot aktiv ekanini tekshiring
4. Internet aloqasi borligini tekshiring

### Frontend ochilmasa:
1. Port band emas-ligini tekshiring (5173)
2. Backend ishlayotganini tekshiring (3000)
3. Browser console da xatolarni tekshiring

---

**Barcha checkbox ✅ bo'lsa - tayyor! Ishga tushirishingiz mumkin! 🚀**
