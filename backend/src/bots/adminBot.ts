import { Telegraf, Markup } from 'telegraf';
import { User, Payment, TelegramSession, Subscription, PricingPlan } from '../models';
import SessionManager from '../services/SessionManager';
import logger from '../config/logger';

const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN || '');

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',');

// Middleware to check admin
const isAdmin = async (ctx: any, next: () => Promise<void>) => {
  if (ADMIN_IDS.includes(ctx.from.id.toString())) {
    return next();
  }
  await ctx.reply('❌ Sizda admin huquqlari yo\'q.');
};

bot.command('start', isAdmin, async (ctx) => {
  await ctx.reply(
    '👨‍💼 Admin Panel\n\nQuyidagi buyruqlardan foydalaning:',
    Markup.keyboard([
      ['➕ Session qo\'shish', '📊 Statistika'],
      ['💳 To\'lovlar', '💰 Narxlar'],
      ['📋 Sessionlar ro\'yxati']
    ]).resize()
  );
});

// Add session
bot.hears('➕ Session qo\'shish', isAdmin, async (ctx) => {
  await ctx.reply(
    '📱 Yangi session qo\'shish uchun telefon raqamini yuboring:\n\n' +
    'Format: +998901234567'
  );
});

bot.hears(/^\+998\d{9}$/, isAdmin, async (ctx) => {
  try {
    const phoneNumber = ctx.message.text;

    await ctx.reply('⏳ Session yaratilmoqda... Telegram kodini kiriting.');

    const sessionManager = SessionManager.getInstance();
    const result = await sessionManager.createSession(phoneNumber);

    await ctx.reply(
      `✅ Session muvaffaqiyatli qo\'shildi!\n\n` +
      `📱 Telefon: ${phoneNumber}\n` +
      `🆔 Session ID: ${result.sessionId}`
    );
  } catch (error: any) {
    logger.error('Error adding session:', error);
    await ctx.reply(`❌ Xatolik: ${error.message}`);
  }
});

// Statistics
bot.hears('📊 Statistika', isAdmin, async (ctx) => {
  try {
    const totalSessions = await TelegramSession.count();
    const available = await TelegramSession.count({ where: { status: 'available' } });
    const rented = await TelegramSession.count({ where: { status: 'rented' } });
    const blocked = await TelegramSession.count({ where: { status: 'spam' } });

    const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
    const totalUsers = await User.count({ where: { role: 'client' } });

    await ctx.reply(
      `📊 Statistika:\n\n` +
      `👥 Jami foydalanuvchilar: ${totalUsers}\n` +
      `📱 Jami sessionlar: ${totalSessions}\n` +
      `   - Mavjud: ${available}\n` +
      `   - Arendada: ${rented}\n` +
      `   - Bloklangan: ${blocked}\n\n` +
      `✅ Faol obunalar: ${activeSubscriptions}`
    );
  } catch (error) {
    logger.error('Error getting stats:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Payments
bot.hears('💳 To\'lovlar', isAdmin, async (ctx) => {
  try {
    const pendingPayments = await Payment.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'user' }],
      limit: 10
    });

    if (pendingPayments.length === 0) {
      return await ctx.reply('✅ Hozircha tasdiqlanmagan to\'lovlar yo\'q.');
    }

    for (const payment of pendingPayments) {
      const user = payment.user as any;

      await ctx.reply(
        `💳 To\'lov ID: ${payment.id}\n` +
        `👤 Foydalanuvchi: ${user.first_name} (@${user.username})\n` +
        `💰 Summa: ${payment.amount} so'm\n` +
        `📅 Sana: ${new Date(payment.created_at!).toLocaleString()}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Tasdiqlash', `confirm_${payment.id}`),
            Markup.button.callback('❌ Rad etish', `reject_${payment.id}`)
          ]
        ])
      );

      if (payment.receipt_photo) {
        await ctx.replyWithPhoto(payment.receipt_photo);
      }
    }
  } catch (error) {
    logger.error('Error getting payments:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Confirm payment callback
bot.action(/confirm_(.+)/, isAdmin, async (ctx) => {
  try {
    const paymentId = ctx.match[1];

    await Payment.update(
      {
        status: 'confirmed',
        confirmed_by: ctx.from.id.toString(),
        confirmed_at: new Date()
      },
      { where: { id: paymentId } }
    );

    await ctx.answerCbQuery('✅ To\'lov tasdiqlandi');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (error) {
    logger.error('Error confirming payment:', error);
    await ctx.answerCbQuery('❌ Xatolik');
  }
});

// Reject payment callback
bot.action(/reject_(.+)/, isAdmin, async (ctx) => {
  try {
    const paymentId = ctx.match[1];

    await Payment.update(
      { status: 'rejected' },
      { where: { id: paymentId } }
    );

    await ctx.answerCbQuery('❌ To\'lov rad etildi');
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch (error) {
    logger.error('Error rejecting payment:', error);
    await ctx.answerCbQuery('❌ Xatolik');
  }
});

// Sessions list
bot.hears('📋 Sessionlar ro\'yxati', isAdmin, async (ctx) => {
  try {
    const sessions = await TelegramSession.findAll({
      limit: 20,
      order: [['created_at', 'DESC']]
    });

    if (sessions.length === 0) {
      return await ctx.reply('📭 Sessionlar yo\'q.');
    }

    let message = '📋 Sessionlar ro\'yxati:\n\n';

    sessions.forEach((session, index) => {
      const statusIcon = session.status === 'available' ? '✅' :
                        session.status === 'rented' ? '🔵' :
                        session.status === 'blocked' ? '🔴' : '⚫';

      message += `${index + 1}. ${statusIcon} ${session.phone_number}\n`;
      message += `   Guruhlar: ${session.groups_count}\n`;
      message += `   Status: ${session.status}\n\n`;
    });

    await ctx.reply(message);
  } catch (error) {
    logger.error('Error getting sessions:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Manage pricing
bot.hears('💰 Narxlar', isAdmin, async (ctx) => {
  try {
    const plans = await PricingPlan.findAll();

    let message = '💰 Narxlar:\n\n';

    plans.forEach((plan) => {
      message += `${plan.plan_type.toUpperCase()}: ${plan.price} so\'m\n`;
      message += `Muddati: ${plan.duration_days} kun\n`;
      message += `Status: ${plan.is_active ? '✅ Faol' : '❌ O\'chirilgan'}\n\n`;
    });

    await ctx.reply(message);
  } catch (error) {
    logger.error('Error getting prices:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

export const startAdminBot = async () => {
  try {
    await bot.launch();
    logger.info('✅ Admin bot started');
  } catch (error) {
    logger.error('Failed to start admin bot:', error);
    throw error;
  }
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
