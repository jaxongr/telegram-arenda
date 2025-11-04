import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import input from 'input';
import logger from '../config/logger';
import path from 'path';
import fs from 'fs';

interface ClientConfig {
  apiId: number;
  apiHash: string;
  sessionString?: string;
  phoneNumber?: string;
}

export class TelegramClientWrapper {
  private client: TelegramClient;
  private phoneNumber: string;
  private sessionString: string;
  private isConnected: boolean = false;

  constructor(config: ClientConfig) {
    const session = new StringSession(config.sessionString || '');
    this.client = new TelegramClient(
      session,
      config.apiId,
      config.apiHash,
      {
        connectionRetries: 5,
        useWSS: false
      }
    );
    this.phoneNumber = config.phoneNumber || '';
    this.sessionString = config.sessionString || '';
  }

  /**
   * Connect and authorize the client
   */
  async connect(): Promise<string> {
    try {
      await this.client.start({
        phoneNumber: async () => this.phoneNumber,
        password: async () => await input.text('Password (if enabled): '),
        phoneCode: async () => await input.text('Enter the code you received: '),
        onError: (err) => {
          logger.error('Telegram auth error:', err);
          throw err;
        },
      });

      this.isConnected = true;
      this.sessionString = (this.client.session as StringSession).save() as string;

      logger.info(`✅ Client connected: ${this.phoneNumber}`);
      return this.sessionString;
    } catch (error) {
      logger.error(`❌ Failed to connect client ${this.phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Reconnect existing session
   */
  async reconnect(): Promise<boolean> {
    try {
      if (!this.sessionString) {
        throw new Error('No session string available');
      }

      await this.client.connect();
      this.isConnected = await this.client.isUserAuthorized();

      if (!this.isConnected) {
        throw new Error('Session expired or invalid');
      }

      logger.info(`✅ Client reconnected: ${this.phoneNumber}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to reconnect client ${this.phoneNumber}:`, error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get all dialogs (chats/groups)
   */
  async getDialogs(): Promise<Api.Dialog[]> {
    try {
      if (!this.isConnected) {
        await this.reconnect();
      }

      const dialogs = await this.client.getDialogs({ limit: 500 });
      return dialogs;
    } catch (error) {
      logger.error('Failed to get dialogs:', error);
      throw error;
    }
  }

  /**
   * Get only groups/channels
   */
  async getGroups(): Promise<any[]> {
    try {
      const dialogs = await this.getDialogs();
      const groups = dialogs.filter(dialog => {
        const entity = dialog.entity;
        return entity.className === 'Channel' || entity.className === 'Chat';
      });

      return groups.map(dialog => ({
        id: dialog.entity.id.toString(),
        title: dialog.title || '',
        username: (dialog.entity as any).username || null,
        isChannel: (dialog.entity as any).broadcast || false,
        isMegagroup: (dialog.entity as any).megagroup || false,
        participantsCount: (dialog.entity as any).participantsCount || 0
      }));
    } catch (error) {
      logger.error('Failed to get groups:', error);
      throw error;
    }
  }

  /**
   * Check if group has restrictions
   */
  async checkGroupRestrictions(groupId: string): Promise<boolean> {
    try {
      const entity = await this.client.getEntity(groupId);
      const chat = entity as any;

      // Check if user has send message permission
      if (chat.defaultBannedRights) {
        return chat.defaultBannedRights.sendMessages || false;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to check restrictions for group ${groupId}:`, error);
      return true; // If error, assume restricted
    }
  }

  /**
   * Check if group has delete bots
   */
  async checkDeleteBot(groupId: string): Promise<boolean> {
    try {
      const participants = await this.client.getParticipants(groupId, {
        limit: 200,
        filter: new Api.ChannelParticipantsAdmins()
      });

      // Look for common delete bot keywords
      const deleteBotKeywords = ['delete', 'clean', 'anti', 'spam', 'guard'];

      for (const participant of participants) {
        const user = participant as any;
        if (user.bot) {
          const username = user.username?.toLowerCase() || '';
          const firstName = user.firstName?.toLowerCase() || '';

          if (deleteBotKeywords.some(keyword =>
            username.includes(keyword) || firstName.includes(keyword)
          )) {
            logger.info(`🤖 Delete bot detected in group ${groupId}: ${username || firstName}`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error(`Failed to check delete bot for group ${groupId}:`, error);
      return false;
    }
  }

  /**
   * Send message to a group
   */
  async sendMessage(groupId: string, message: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.reconnect();
      }

      await this.client.sendMessage(groupId, { message });
      logger.info(`✅ Message sent to group ${groupId}`);
      return true;
    } catch (error: any) {
      // Check for flood wait
      if (error.errorMessage?.includes('FLOOD_WAIT')) {
        const seconds = parseInt(error.errorMessage.match(/\d+/)?.[0] || '60');
        logger.warn(`⏳ Flood wait: ${seconds} seconds for ${this.phoneNumber}`);
        throw { type: 'FLOOD_WAIT', seconds };
      }

      // Check for spam block
      if (error.errorMessage?.includes('PEER_FLOOD')) {
        logger.error(`🚫 Spam detected for ${this.phoneNumber}`);
        throw { type: 'SPAM_BLOCK' };
      }

      // Check for banned
      if (error.errorMessage?.includes('USER_BANNED')) {
        logger.error(`🚫 User banned: ${this.phoneNumber}`);
        throw { type: 'USER_BANNED' };
      }

      logger.error(`Failed to send message to group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Check if session is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return await this.reconnect();
      }

      const me = await this.client.getMe();
      return !!me;
    } catch (error) {
      logger.error(`Health check failed for ${this.phoneNumber}:`, error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect client
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info(`Disconnected client: ${this.phoneNumber}`);
    } catch (error) {
      logger.error('Failed to disconnect:', error);
    }
  }

  /**
   * Get session string
   */
  getSessionString(): string {
    return this.sessionString;
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get phone number
   */
  getPhoneNumber(): string {
    return this.phoneNumber;
  }
}

export default TelegramClientWrapper;
