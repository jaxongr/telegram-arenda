import { TelegramSession, Subscription } from '../models';
import SessionManager from './SessionManager';
import logger from '../config/logger';
import { Op } from 'sequelize';

export class SpamDetector {
  private sessionManager: SessionManager;

  constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  /**
   * Handle flood wait error
   */
  async handleFloodWait(sessionId: string, waitSeconds: number): Promise<void> {
    try {
      logger.warn(`⏳ Flood wait for session ${sessionId}: ${waitSeconds}s`);

      // Update session status
      await TelegramSession.update(
        {
          status: 'blocked',
          ban_reason: `Flood wait: ${waitSeconds}s`,
          last_health_check: new Date()
        },
        { where: { id: sessionId } }
      );

      // If flood wait is > 1 hour, trigger replacement
      if (waitSeconds > 3600) {
        logger.error(`🚨 Long flood wait detected (${waitSeconds}s), triggering replacement`);
        await this.replaceSession(sessionId, 'FLOOD_WAIT');
      }
    } catch (error) {
      logger.error('Failed to handle flood wait:', error);
    }
  }

  /**
   * Handle session ban
   */
  async handleSessionBan(sessionId: string, banType: string): Promise<void> {
    try {
      logger.error(`🚫 Session banned: ${sessionId} (${banType})`);

      // Update session status
      await TelegramSession.update(
        {
          status: 'spam',
          ban_reason: banType,
          is_healthy: false,
          last_health_check: new Date()
        },
        { where: { id: sessionId } }
      );

      // Trigger automatic replacement
      await this.replaceSession(sessionId, banType);
    } catch (error) {
      logger.error('Failed to handle session ban:', error);
    }
  }

  /**
   * Replace blocked/banned session with new one
   */
  async replaceSession(oldSessionId: string, reason: string): Promise<void> {
    try {
      logger.info(`🔄 Starting session replacement for ${oldSessionId}`);

      // Get the old session
      const oldSession = await TelegramSession.findByPk(oldSessionId);

      if (!oldSession) {
        throw new Error('Old session not found');
      }

      // Get user's active subscription
      const subscription = await Subscription.findOne({
        where: {
          session_id: oldSessionId,
          status: 'active'
        }
      });

      if (!subscription) {
        logger.warn('No active subscription found for session, skipping replacement');
        return;
      }

      // Find available replacement session
      const newSession = await TelegramSession.findOne({
        where: {
          status: 'available',
          is_healthy: true,
          groups_count: {
            [Op.gte]: 200 // Must have at least 200 groups
          }
        },
        order: [['groups_count', 'DESC']] // Prefer sessions with more groups
      });

      if (!newSession) {
        logger.error('❌ No available replacement session found');

        // Notify admins (you could add Telegram notification here)
        // TODO: Send notification to admin bot

        return;
      }

      // Update old session
      await TelegramSession.update(
        {
          status: 'blocked',
          current_user_id: null
        },
        { where: { id: oldSessionId } }
      );

      // Update new session
      await TelegramSession.update(
        {
          status: 'rented',
          current_user_id: subscription.user_id
        },
        { where: { id: newSession.id } }
      );

      // Update subscription
      await Subscription.update(
        { session_id: newSession.id },
        { where: { id: subscription.id } }
      );

      // Unload old session from memory
      await this.sessionManager.unloadSession(oldSessionId);

      // Load new session
      await this.sessionManager.loadSession(newSession.id);

      logger.info(`✅ Session replaced successfully: ${oldSessionId} -> ${newSession.id}`);
      logger.info(`   Reason: ${reason}`);
      logger.info(`   User: ${subscription.user_id}`);
      logger.info(`   New session groups: ${newSession.groups_count}`);

      // TODO: Notify user about session replacement via bot

    } catch (error) {
      logger.error('Failed to replace session:', error);
      throw error;
    }
  }

  /**
   * Check session health and auto-replace if needed
   */
  async checkAndReplaceUnhealthySessions(): Promise<void> {
    try {
      logger.info('🏥 Checking for unhealthy sessions...');

      // Find sessions that are rented but unhealthy
      const unhealthySessions = await TelegramSession.findAll({
        where: {
          status: 'rented',
          is_healthy: false,
          last_health_check: {
            [Op.lt]: new Date(Date.now() - 10 * 60 * 1000) // Last checked > 10 minutes ago
          }
        }
      });

      if (unhealthySessions.length === 0) {
        logger.info('✅ All rented sessions are healthy');
        return;
      }

      logger.warn(`⚠️ Found ${unhealthySessions.length} unhealthy sessions`);

      // Replace each unhealthy session
      for (const session of unhealthySessions) {
        try {
          await this.replaceSession(session.id, 'UNHEALTHY');
        } catch (error) {
          logger.error(`Failed to replace unhealthy session ${session.id}:`, error);
        }

        // Delay between replacements
        await this.delay(2000);
      }

      logger.info('✅ Unhealthy session check completed');
    } catch (error) {
      logger.error('Failed to check unhealthy sessions:', error);
    }
  }

  /**
   * Detect spam patterns
   */
  async detectSpamPattern(sessionId: string): Promise<boolean> {
    try {
      const session = await TelegramSession.findByPk(sessionId);

      if (!session) {
        return false;
      }

      // Check if too many messages sent today
      const dailyLimit = 1000; // Adjust based on your needs
      if (session.messages_sent_today > dailyLimit) {
        logger.warn(`⚠️ Session ${sessionId} exceeded daily limit: ${session.messages_sent_today}/${dailyLimit}`);
        return true;
      }

      // Check if session is frequently blocked
      // You could add more sophisticated checks here

      return false;
    } catch (error) {
      logger.error('Failed to detect spam pattern:', error);
      return false;
    }
  }

  /**
   * Helper: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SpamDetector;
