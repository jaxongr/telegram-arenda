import { Router } from 'express';
import { Message, TelegramSession, Subscription } from '../models';
import MessageQueue from '../services/MessageQueue';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/messages
 * Create and send new message
 */
router.post('/', async (req, res) => {
  try {
    const { user_id, content, contact_number } = req.body;

    if (!user_id || !content || !contact_number) {
      return res.status(400).json({
        success: false,
        error: 'user_id, content, and contact_number are required'
      });
    }

    // Validate phone number format (simple validation)
    const phoneRegex = /^[\+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(contact_number.replace(/[\s\-()]/g, ''))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Get user's active subscription
    const subscription = await Subscription.findOne({
      where: {
        user_id,
        status: 'active'
      },
      include: [{
        model: TelegramSession,
        as: 'session'
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const session = subscription.session as any;

    if (!session || session.status !== 'rented') {
      return res.status(400).json({
        success: false,
        error: 'Session not available'
      });
    }

    // Create message record
    const message = await Message.create({
      session_id: session.id,
      user_id,
      content,
      contact_number,
      status: 'pending',
      total_groups: 0,
      sent_count: 0,
      failed_count: 0,
      skipped_count: 0
    });

    // Add to queue
    const messageQueue = MessageQueue.getInstance();
    await messageQueue.addMessage({
      messageId: message.id,
      sessionId: session.id,
      userId: user_id,
      content,
      contactNumber: contact_number
    });

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message queued successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/messages
 * Get messages
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, status, limit = 50 } = req.query;

    const where: any = {};
    if (user_id) where.user_id = user_id;
    if (status) where.status = status;

    const messages = await Message.findAll({
      where,
      limit: parseInt(limit as string),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    logger.error('Failed to get messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/messages/:id
 * Get message by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error: any) {
    logger.error('Failed to get message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
