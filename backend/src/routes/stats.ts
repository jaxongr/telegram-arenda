import { Router } from 'express';
import { TelegramSession, Message, Subscription, Payment, User } from '../models';
import { Op } from 'sequelize';
import MessageQueue from '../services/MessageQueue';

const router = Router();

router.get('/dashboard', async (req, res) => {
  try {
    const totalSessions = await TelegramSession.count();
    const availableSessions = await TelegramSession.count({ where: { status: 'available' } });
    const rentedSessions = await TelegramSession.count({ where: { status: 'rented' } });
    const blockedSessions = await TelegramSession.count({ where: { status: { [Op.in]: ['blocked', 'spam'] } } });

    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
    const totalUsers = await User.count({ where: { role: 'client' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await Message.count({
      where: { created_at: { [Op.gte]: today } }
    });

    const messagesCompleted = await Message.count({
      where: {
        created_at: { [Op.gte]: today },
        status: 'completed'
      }
    });

    const pendingPayments = await Payment.count({ where: { status: 'pending' } });

    const queueStats = await MessageQueue.getInstance().getQueueStats();

    res.json({
      success: true,
      data: {
        sessions: {
          total: totalSessions,
          available: availableSessions,
          rented: rentedSessions,
          blocked: blockedSessions
        },
        subscriptions: {
          active: activeSubscriptions
        },
        users: {
          total: totalUsers
        },
        messages: {
          today: messagesToday,
          completed: messagesCompleted
        },
        payments: {
          pending: pendingPayments
        },
        queue: queueStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
