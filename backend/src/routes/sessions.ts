import { Router } from 'express';
import { TelegramSession, SessionGroup, Subscription } from '../models';
import SessionManager from '../services/SessionManager';
import logger from '../config/logger';

const router = Router();

/**
 * GET /api/sessions
 * Get all sessions
 */
router.get('/', async (req, res) => {
  try {
    const { status, user_id } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (user_id) where.current_user_id = user_id;

    const sessions = await TelegramSession.findAll({
      where,
      include: [
        {
          model: SessionGroup,
          as: 'groups',
          where: { is_active: true },
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    logger.error('Failed to get sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TelegramSession.findByPk(id, {
      include: [
        {
          model: SessionGroup,
          as: 'groups'
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    logger.error('Failed to get session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sessions
 * Create new session
 */
router.post('/', async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: 'phone_number is required'
      });
    }

    const sessionManager = SessionManager.getInstance();
    const result = await sessionManager.createSession(phone_number);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Session created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sessions/:id/refresh-groups
 * Refresh groups for session
 */
router.post('/:id/refresh-groups', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TelegramSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // TODO: Implement group refresh logic

    res.json({
      success: true,
      message: 'Groups refreshed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to refresh groups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete session
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await TelegramSession.findByPk(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if session is currently rented
    if (session.status === 'rented') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete rented session'
      });
    }

    // Unload from memory
    const sessionManager = SessionManager.getInstance();
    await sessionManager.unloadSession(id);

    // Delete from database
    await session.destroy();

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
