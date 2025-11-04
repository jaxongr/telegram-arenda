import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';

import { initDatabase } from './models';
import logger from './config/logger';
import SessionManager from './services/SessionManager';
import MessageQueue from './services/MessageQueue';
import { SpamDetector } from './services/SpamDetector';

// Import routes
import sessionRoutes from './routes/sessions';
import subscriptionRoutes from './routes/subscriptions';
import messageRoutes from './routes/messages';
import paymentRoutes from './routes/payments';
import statsRoutes from './routes/stats';

// Import bots
import { startClientBot } from './bots/clientBot';
import { startAdminBot } from './bots/adminBot';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible globally
export { io };

// Initialize application
async function initialize() {
  try {
    // Connect to database
    logger.info('🔌 Connecting to database...');
    const dbConnected = await initDatabase();

    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Initialize services
    logger.info('🚀 Initializing services...');
    const sessionManager = SessionManager.getInstance();
    const messageQueue = MessageQueue.getInstance();

    // Start health check interval
    sessionManager.startHealthCheckInterval();

    // Schedule daily counter reset (midnight)
    cron.schedule('0 0 * * *', async () => {
      logger.info('🔄 Resetting daily message counters...');
      await sessionManager.resetDailyCounters();
    });

    // Schedule unhealthy session check (every 15 minutes)
    cron.schedule('*/15 * * * *', async () => {
      const spamDetector = new SpamDetector();
      await spamDetector.checkAndReplaceUnhealthySessions();
    });

    // Start Telegram bots
    logger.info('🤖 Starting Telegram bots...');
    await startClientBot();
    await startAdminBot();

    // Start server
    server.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');

  const sessionManager = SessionManager.getInstance();
  const messageQueue = MessageQueue.getInstance();

  sessionManager.stopHealthCheckInterval();
  await messageQueue.close();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');

  const sessionManager = SessionManager.getInstance();
  const messageQueue = MessageQueue.getInstance();

  sessionManager.stopHealthCheckInterval();
  await messageQueue.close();

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start application
initialize();
