import TelegramClientWrapper from './TelegramClientWrapper';
import { TelegramSession, SessionGroup } from '../models';
import logger from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

interface SessionClient {
  client: TelegramClientWrapper;
  sessionId: string;
  lastHealthCheck: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private activeSessions: Map<string, SessionClient> = new Map();
  private apiId: number;
  private apiHash: string;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
    this.apiHash = process.env.TELEGRAM_API_HASH || '';

    if (!this.apiId || !this.apiHash) {
      throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment');
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize a new session
   */
  async createSession(phoneNumber: string): Promise<{ sessionId: string; sessionString: string }> {
    try {
      // Check if session already exists
      const existingSession = await TelegramSession.findOne({
        where: { phone_number: phoneNumber }
      });

      if (existingSession) {
        throw new Error('Session with this phone number already exists');
      }

      // Create new client
      const client = new TelegramClientWrapper({
        apiId: this.apiId,
        apiHash: this.apiHash,
        phoneNumber: phoneNumber
      });

      // Connect and authorize
      const sessionString = await client.connect();

      // Save to database
      const session = await TelegramSession.create({
        phone_number: phoneNumber,
        session_string: sessionString,
        status: 'available',
        groups_count: 0,
        messages_sent_today: 0,
        is_healthy: true,
        last_health_check: new Date()
      });

      // Load groups for this session
      await this.loadSessionGroups(session.id, client);

      logger.info(`✅ Session created successfully: ${phoneNumber}`);

      return {
        sessionId: session.id,
        sessionString: sessionString
      };
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Load session groups and save to database
   */
  private async loadSessionGroups(sessionId: string, client: TelegramClientWrapper): Promise<void> {
    try {
      const groups = await client.getGroups();

      // Process groups in batches
      for (const group of groups) {
        try {
          // Check restrictions and delete bots
          const hasRestrictions = await client.checkGroupRestrictions(group.id);
          const hasDeleteBot = await client.checkDeleteBot(group.id);

          await SessionGroup.create({
            session_id: sessionId,
            group_id: group.id,
            group_title: group.title,
            group_username: group.username,
            is_active: !hasRestrictions && !hasDeleteBot,
            has_restrictions: hasRestrictions,
            has_delete_bot: hasDeleteBot,
            message_count: 0
          });
        } catch (error) {
          logger.error(`Failed to process group ${group.id}:`, error);
        }
      }

      // Update session groups count
      const activeGroupsCount = await SessionGroup.count({
        where: { session_id: sessionId, is_active: true }
      });

      await TelegramSession.update(
        { groups_count: activeGroupsCount },
        { where: { id: sessionId } }
      );

      logger.info(`✅ Loaded ${activeGroupsCount} active groups for session ${sessionId}`);
    } catch (error) {
      logger.error('Failed to load session groups:', error);
    }
  }

  /**
   * Load session into memory
   */
  async loadSession(sessionId: string): Promise<TelegramClientWrapper> {
    try {
      // Check if already loaded
      if (this.activeSessions.has(sessionId)) {
        const sessionClient = this.activeSessions.get(sessionId)!;
        if (sessionClient.client.getConnectionStatus()) {
          return sessionClient.client;
        }
      }

      // Load from database
      const session = await TelegramSession.findByPk(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.session_string) {
        throw new Error('Session string not found');
      }

      // Create client
      const client = new TelegramClientWrapper({
        apiId: this.apiId,
        apiHash: this.apiHash,
        sessionString: session.session_string,
        phoneNumber: session.phone_number
      });

      // Reconnect
      const connected = await client.reconnect();

      if (!connected) {
        throw new Error('Failed to reconnect session');
      }

      // Store in memory
      this.activeSessions.set(sessionId, {
        client,
        sessionId,
        lastHealthCheck: new Date()
      });

      logger.info(`✅ Session loaded: ${session.phone_number}`);

      return client;
    } catch (error) {
      logger.error(`Failed to load session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session client
   */
  async getSession(sessionId: string): Promise<TelegramClientWrapper> {
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!.client;
    }

    return await this.loadSession(sessionId);
  }

  /**
   * Unload session from memory
   */
  async unloadSession(sessionId: string): Promise<void> {
    try {
      if (this.activeSessions.has(sessionId)) {
        const sessionClient = this.activeSessions.get(sessionId)!;
        await sessionClient.client.disconnect();
        this.activeSessions.delete(sessionId);
        logger.info(`Session unloaded: ${sessionId}`);
      }
    } catch (error) {
      logger.error('Failed to unload session:', error);
    }
  }

  /**
   * Health check for all active sessions
   */
  async performHealthCheck(): Promise<void> {
    logger.info('🏥 Starting health check for all sessions...');

    for (const [sessionId, sessionClient] of this.activeSessions.entries()) {
      try {
        const isHealthy = await sessionClient.client.healthCheck();

        await TelegramSession.update(
          {
            is_healthy: isHealthy,
            last_health_check: new Date(),
            status: isHealthy ? 'rented' : 'disconnected'
          },
          { where: { id: sessionId } }
        );

        if (!isHealthy) {
          logger.warn(`⚠️ Session unhealthy: ${sessionId}`);
          // Try to reconnect
          await this.loadSession(sessionId);
        }

        sessionClient.lastHealthCheck = new Date();
      } catch (error) {
        logger.error(`Health check failed for session ${sessionId}:`, error);
      }
    }

    logger.info('✅ Health check completed');
  }

  /**
   * Start health check interval
   */
  startHealthCheckInterval(): void {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '300000'); // 5 minutes

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);

    logger.info(`✅ Health check interval started (${interval}ms)`);
  }

  /**
   * Stop health check interval
   */
  stopHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health check interval stopped');
    }
  }

  /**
   * Get all active sessions count
   */
  getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Reset daily message counters
   */
  async resetDailyCounters(): Promise<void> {
    try {
      await TelegramSession.update(
        { messages_sent_today: 0 },
        { where: {} }
      );
      logger.info('✅ Daily message counters reset');
    } catch (error) {
      logger.error('Failed to reset daily counters:', error);
    }
  }
}

export default SessionManager;
