# Telegram Session Rental Platform

Professional platform for renting Telegram accounts for dispatch services. Built with Node.js, React, and PostgreSQL.

## Features

### Core Functionality
- **Session Management**: Manage 1000+ Telegram sessions simultaneously
- **Auto Message Distribution**: Distribute messages to 250+ groups per session
- **Smart Rate Limiting**: 10 groups per batch, 5-second delays to avoid spam detection
- **Auto Session Replacement**: Automatically replace blocked/banned sessions
- **Spam Detection**: Detect and handle FloodWait, SpamBlock, and UserBan errors
- **Group Validation**: Skip restricted groups and groups with delete bots
- **Real-time Monitoring**: Live dashboard with WebSocket updates

### Admin Features
- Dashboard with statistics
- Session management (add, remove, monitor)
- Payment confirmation system
- Pricing management
- Message queue monitoring

### Client Features (Telegram Bot)
- Subscription management (daily, weekly, monthly)
- Message broadcasting
- Balance tracking
- Real-time broadcast status

## Tech Stack

### Backend
- **Node.js + TypeScript**: Server runtime
- **Express.js**: REST API framework
- **GramJS**: Telegram client library
- **PostgreSQL**: Primary database
- **Redis + BullMQ**: Message queue system
- **Socket.io**: Real-time updates
- **Telegraf**: Telegram bot framework

### Frontend
- **React + TypeScript**: UI framework
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **Axios**: HTTP client
- **React Router**: Navigation
- **Recharts**: Data visualization

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Telegram API credentials (api_id, api_hash)
- Two Telegram Bot tokens (client bot, admin bot)

### Step 1: Clone Repository
```bash
git clone <your-repo>
cd telegram-arend
```

### Step 2: Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telegram_rental
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Telegram API
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Bots
ADMIN_BOT_TOKEN=your_admin_bot_token
CLIENT_BOT_TOKEN=your_client_bot_token
ADMIN_TELEGRAM_IDS=123456789,987654321

# JWT
JWT_SECRET=your_secret_key

# Paths
SESSION_PATH=./sessions

# Queue Config
QUEUE_CONCURRENCY=10
MESSAGE_DELAY_MS=5000
GROUPS_PER_BATCH=10
HEALTH_CHECK_INTERVAL_MS=300000
```

### Step 3: Setup Database

```bash
# Create PostgreSQL database
createdb telegram_rental

# Run migrations (will auto-sync on first run)
npm run dev
```

### Step 4: Setup Frontend

```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
```

### Step 5: Start Services

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

## Usage

### Adding New Session

1. Open Admin Bot in Telegram
2. Send `/start`
3. Click "➕ Session qo'shish"
4. Send phone number (format: +998901234567)
5. Enter Telegram verification code
6. Session will be automatically added with 250 groups

### Client Workflow

1. User starts Client Bot: `/start`
2. Chooses subscription plan (daily/weekly/monthly)
3. Sends payment receipt
4. Admin confirms payment via Admin Bot
5. Session automatically assigned to user
6. User sends message with format:
   ```
   📱 +998901234567
   Message content here...
   ```
7. System automatically distributes to all groups

### Auto Replacement System

When a session gets blocked:
1. System detects spam/ban
2. Finds available replacement session
3. Updates user's subscription
4. Notifies user (optional)
5. User continues without interruption

## Architecture

```
┌─────────────────┐
│  Telegram Bots  │
│  (Admin/Client) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│   REST API      │◄─────┤  Web Dashboard  │
│   (Express)     │      │     (React)     │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│ Session Manager │      │  Message Queue  │
│   (GramJS)      │◄─────┤    (BullMQ)     │
└────────┬────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│   PostgreSQL    │      │     Redis       │
│   (Database)    │      │    (Cache)      │
└─────────────────┘      └─────────────────┘
```

## API Endpoints

### Sessions
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - Delete session

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message status

### Payments
- `GET /api/payments` - Get payments
- `POST /api/payments` - Create payment
- `PATCH /api/payments/:id/confirm` - Confirm payment

### Subscriptions
- `GET /api/subscriptions` - Get subscriptions
- `POST /api/subscriptions` - Create subscription

### Stats
- `GET /api/stats/dashboard` - Dashboard statistics

## Security Features

- Session strings encrypted in database
- JWT authentication for API
- Admin-only endpoints
- Rate limiting on APIs
- Input validation
- SQL injection protection (Sequelize ORM)
- XSS protection

## Performance

- Handles 1000+ active sessions
- 10,000+ messages per hour
- Sub-second message queuing
- Real-time dashboard updates
- Automatic load balancing

## Troubleshooting

### Session Login Issues
```bash
# Check if API credentials are correct
echo $TELEGRAM_API_ID
echo $TELEGRAM_API_HASH
```

### Queue Not Processing
```bash
# Check Redis connection
redis-cli ping

# Check BullMQ queues
redis-cli KEYS bull:*
```

### Database Connection Failed
```bash
# Check PostgreSQL status
pg_isready

# Test connection
psql -h localhost -U postgres -d telegram_rental
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── bots/            # Telegram bots
│   └── index.ts         # Entry point
└── package.json

frontend/
├── src/
│   ├── pages/           # Page components
│   ├── App.tsx          # Main app
│   └── index.css        # Styles
└── package.json
```

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Environment Variables
Ensure all production environment variables are set:
- Use strong JWT secrets
- Use production database credentials
- Enable HTTPS
- Set NODE_ENV=production

## License

Private - All rights reserved

## Support

For support, contact: @your_support_username

---

Built with ❤️ for dispatch services
