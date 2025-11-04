import { Queue, Worker, Job } from 'bullmq';
import redis from '../config/redis';
import SessionManager from './SessionManager';
import { Message, SessionGroup, TelegramSession } from '../models';
import logger from '../config/logger';
import { SpamDetector } from './SpamDetector';

interface MessageJob {
  messageId: string;
  sessionId: string;
  userId: string;
  content: string;
  contactNumber: string;
}

interface GroupBatchJob {
  messageId: string;
  sessionId: string;
  groupIds: string[];
  content: string;
}

export class MessageQueue {
  private static instance: MessageQueue;
  private messageQueue: Queue<MessageJob>;
  private groupBatchQueue: Queue<GroupBatchJob>;
  private messageWorker: Worker<MessageJob>;
  private groupBatchWorker: Worker<GroupBatchJob>;
  private sessionManager: SessionManager;
  private spamDetector: SpamDetector;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
    this.spamDetector = new SpamDetector();

    // Create queues
    this.messageQueue = new Queue<MessageJob>('messages', {
      connection: redis
    });

    this.groupBatchQueue = new Queue<GroupBatchJob>('group-batches', {
      connection: redis
    });

    // Create workers
    this.messageWorker = new Worker<MessageJob>(
      'messages',
      async (job) => await this.processMessage(job),
      {
        connection: redis,
        concurrency: 50 // Process 50 messages in parallel
      }
    );

    this.groupBatchWorker = new Worker<GroupBatchJob>(
      'group-batches',
      async (job) => await this.processGroupBatch(job),
      {
        connection: redis,
        concurrency: 10 // Process 10 batches in parallel per session
      }
    );

    // Worker events
    this.messageWorker.on('completed', (job) => {
      logger.info(`Message job completed: ${job.id}`);
    });

    this.messageWorker.on('failed', (job, err) => {
      logger.error(`Message job failed: ${job?.id}`, err);
    });

    this.groupBatchWorker.on('completed', (job) => {
      logger.info(`Group batch completed: ${job.id}`);
    });

    this.groupBatchWorker.on('failed', (job, err) => {
      logger.error(`Group batch failed: ${job?.id}`, err);
    });

    logger.info('✅ Message Queue System initialized');
  }

  public static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  /**
   * Add new message to queue
   */
  async addMessage(data: MessageJob): Promise<void> {
    try {
      await this.messageQueue.add('process-message', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });

      logger.info(`Message added to queue: ${data.messageId}`);
    } catch (error) {
      logger.error('Failed to add message to queue:', error);
      throw error;
    }
  }

  /**
   * Process message - split into batches
   */
  private async processMessage(job: Job<MessageJob>): Promise<void> {
    const { messageId, sessionId, userId, content, contactNumber } = job.data;

    try {
      // Update message status
      await Message.update(
        { status: 'processing', started_at: new Date() },
        { where: { id: messageId } }
      );

      // Get active groups for this session
      const groups = await SessionGroup.findAll({
        where: {
          session_id: sessionId,
          is_active: true
        }
      });

      if (groups.length === 0) {
        throw new Error('No active groups found for this session');
      }

      // Update total groups count
      await Message.update(
        { total_groups: groups.length },
        { where: { id: messageId } }
      );

      // Split groups into batches of 10
      const batchSize = parseInt(process.env.GROUPS_PER_BATCH || '10');
      const groupIds = groups.map(g => g.group_id);

      for (let i = 0; i < groupIds.length; i += batchSize) {
        const batchGroupIds = groupIds.slice(i, i + batchSize);

        // Add batch to queue with delay
        const delay = i > 0 ? parseInt(process.env.MESSAGE_DELAY_MS || '5000') : 0;

        await this.groupBatchQueue.add(
          'send-batch',
          {
            messageId,
            sessionId,
            groupIds: batchGroupIds,
            content: `${content}\n\n📞 Aloqa: ${contactNumber}`
          },
          {
            delay,
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 10000
            }
          }
        );
      }

      logger.info(`✅ Message split into ${Math.ceil(groupIds.length / batchSize)} batches`);
    } catch (error: any) {
      logger.error('Failed to process message:', error);

      await Message.update(
        {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date()
        },
        { where: { id: messageId } }
      );

      throw error;
    }
  }

  /**
   * Process group batch - send to multiple groups
   */
  private async processGroupBatch(job: Job<GroupBatchJob>): Promise<void> {
    const { messageId, sessionId, groupIds, content } = job.data;

    try {
      // Get session client
      const client = await this.sessionManager.getSession(sessionId);

      let sentCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Send to each group
      for (const groupId of groupIds) {
        try {
          // Check group status before sending
          const group = await SessionGroup.findOne({
            where: { session_id: sessionId, group_id: groupId }
          });

          if (!group || !group.is_active) {
            skippedCount++;
            continue;
          }

          // Send message
          const sent = await client.sendMessage(groupId, content);

          if (sent) {
            sentCount++;

            // Update group stats
            await SessionGroup.update(
              {
                last_message_at: new Date(),
                message_count: group.message_count + 1
              },
              { where: { id: group.id } }
            );
          } else {
            failedCount++;
          }

          // Small delay between messages
          await this.delay(500);
        } catch (error: any) {
          // Handle specific Telegram errors
          if (error.type === 'FLOOD_WAIT') {
            logger.warn(`Flood wait detected: ${error.seconds}s`);

            // Mark session as needing cooldown
            await this.spamDetector.handleFloodWait(sessionId, error.seconds);

            // Re-queue this batch with delay
            await this.groupBatchQueue.add(
              'send-batch',
              job.data,
              {
                delay: (error.seconds + 10) * 1000
              }
            );

            throw error; // Stop processing this batch
          } else if (error.type === 'SPAM_BLOCK' || error.type === 'USER_BANNED') {
            logger.error(`Session blocked/banned: ${sessionId}`);

            // Handle spam/ban
            await this.spamDetector.handleSessionBan(sessionId, error.type);

            throw error; // Stop processing
          } else {
            failedCount++;
            logger.error(`Failed to send to group ${groupId}:`, error);
          }
        }
      }

      // Update message stats
      await Message.increment(
        {
          sent_count: sentCount,
          failed_count: failedCount,
          skipped_count: skippedCount
        },
        { where: { id: messageId } }
      );

      // Update session stats
      await TelegramSession.increment(
        {
          messages_sent_today: sentCount,
          last_message_at: new Date()
        },
        { where: { id: sessionId } }
      );

      // Check if message is complete
      const message = await Message.findByPk(messageId);
      if (message) {
        const totalProcessed = message.sent_count + message.failed_count + message.skipped_count;
        if (totalProcessed >= message.total_groups) {
          await Message.update(
            { status: 'completed', completed_at: new Date() },
            { where: { id: messageId } }
          );

          logger.info(`✅ Message completed: ${messageId} (${message.sent_count}/${message.total_groups} sent)`);
        }
      }

      logger.info(`Batch processed: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`);
    } catch (error) {
      logger.error('Failed to process group batch:', error);
      throw error;
    }
  }

  /**
   * Helper: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue stats
   */
  async getQueueStats() {
    const messageQueueCounts = await this.messageQueue.getJobCounts();
    const batchQueueCounts = await this.groupBatchQueue.getJobCounts();

    return {
      messages: messageQueueCounts,
      batches: batchQueueCounts
    };
  }

  /**
   * Pause queue
   */
  async pauseQueue(sessionId?: string): Promise<void> {
    if (sessionId) {
      // Pause specific session jobs (would need custom implementation)
      logger.info(`Pausing queue for session: ${sessionId}`);
    } else {
      await this.messageQueue.pause();
      await this.groupBatchQueue.pause();
      logger.info('All queues paused');
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(sessionId?: string): Promise<void> {
    if (sessionId) {
      logger.info(`Resuming queue for session: ${sessionId}`);
    } else {
      await this.messageQueue.resume();
      await this.groupBatchQueue.resume();
      logger.info('All queues resumed');
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.messageWorker.close();
    await this.groupBatchWorker.close();
    await this.messageQueue.close();
    await this.groupBatchQueue.close();
    logger.info('Message queue closed');
  }
}

export default MessageQueue;
