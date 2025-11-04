import { Telegraf, Markup } from 'telegraf';
import { User, Subscription, TelegramSession, Message, PricingPlan } from '../models';
import MessageQueue from '../services/MessageQueue';
import logger from '../config/logger';

const bot = new Telegraf(process.env.CLIENT_BOT_TOKEN || '');

// User states for conversation flow
const userStates = new Map<number, { state: string; data?: any }>();

// Start command
bot.command('start', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();

    let user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      user = await User.create({
        telegram_id: telegramId,
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        role: 'client',
        is_active: true,
        balance: 0
      });
      logger.info(`New user registered: ${telegramId}`);
    }

    await ctx.reply(
      `Assalomu alaykum, ${ctx.from.first_name}! 👋\n\n` +
      `🚛 Telegram Session Arenda Platformasiga xush kelibsiz!\n\n` +
      `Biz sizga dispetcherlik uchun 250ta guruhli Telegram akkauntlarni arendaga beramiz.\n\n` +
      `📋 Quyidagi tugmalardan birini tanlang:`,
      Markup.keyboard([
        ['📦 Arenda olish', '📊 Mening obunalarim'],
        ['💬 E\'lon yuborish', '💰 Balans'],
        ['📞 Yordam']
      ]).resize()
    );
  } catch (error) {
    logger.error('Error in /start:', error);
    await ctx.reply('❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
  }
});

// Rent subscription
bot.hears('📦 Arenda olish', async (ctx) => {
  try {
    const plans = await PricingPlan.findAll({ where: { is_active: true } });

    if (plans.length === 0) {
      return await ctx.reply('❌ Hozircha tarif rejalar mavjud emas.');
    }

    let message = '💳 Tarif rejalar:\n\n';

    plans.forEach((plan) => {
      const duration = plan.plan_type === 'daily' ? 'kunlik' :
                      plan.plan_type === 'weekly' ? 'haftalik' : 'oylik';
      message += `${duration.toUpperCase()}: ${plan.price} so'm\n`;
      message += `Muddati: ${plan.duration_days} kun\n\n`;
    });

    await ctx.reply(
      message + 'Qaysi tarif rejani tanlaysiz?',
      Markup.keyboard([
        ['📅 Kunlik', '📆 Haftalik', '📅 Oylik'],
        ['🔙 Orqaga']
      ]).resize()
    );

    userStates.set(ctx.from.id, { state: 'selecting_plan' });
  } catch (error) {
    logger.error('Error in rent:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Handle plan selection
bot.hears(['📅 Kunlik', '📆 Haftalik', '📅 Oylik'], async (ctx) => {
  try {
    const state = userStates.get(ctx.from.id);

    if (state?.state !== 'selecting_plan') {
      return;
    }

    const planTypeMap: any = {
      '📅 Kunlik': 'daily',
      '📆 Haftalik': 'weekly',
      '📅 Oylik': 'monthly'
    };

    const planType = planTypeMap[ctx.message.text];
    const plan = await PricingPlan.findOne({ where: { plan_type: planType, is_active: true } });

    if (!plan) {
      return await ctx.reply('❌ Tarif reja topilmadi.');
    }

    userStates.set(ctx.from.id, { state: 'confirming_payment', data: { plan_type: planType } });

    await ctx.reply(
      `✅ Siz ${ctx.message.text} tarifni tanladingiz.\n\n` +
      `💰 Narx: ${plan.price} so'm\n` +
      `⏱ Muddat: ${plan.duration_days} kun\n\n` +
      `To'lovni amalga oshirish uchun quyidagi karta raqamiga pul o'tkazing:\n\n` +
      `💳 Karta: 8600 1234 5678 9012\n` +
      `👤 Ism: John Doe\n\n` +
      `To'lov chekini yuboring:`,
      Markup.keyboard([['🔙 Bekor qilish']]).resize()
    );
  } catch (error) {
    logger.error('Error selecting plan:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Handle payment receipt
bot.on('photo', async (ctx) => {
  try {
    const state = userStates.get(ctx.from.id);

    if (state?.state !== 'confirming_payment') {
      return;
    }

    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      return await ctx.reply('❌ Foydalanuvchi topilmadi.');
    }

    const plan = await PricingPlan.findOne({
      where: { plan_type: state.data.plan_type, is_active: true }
    });

    if (!plan) {
      return await ctx.reply('❌ Tarif reja topilmadi.');
    }

    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    // Create payment record
    await ctx.reply('⏳ To\'lovingiz adminlarga yuborildi. Tasdiqlashni kuting...');

    userStates.delete(ctx.from.id);

    await ctx.reply(
      '✅ Chek qabul qilindi!\n\n' +
      'Admin tomonidan tasdiqlanganidan keyin sizga xabar beramiz.',
      Markup.keyboard([
        ['📦 Arenda olish', '📊 Mening obunalarim'],
        ['💬 E\'lon yuborish', '💰 Balans'],
        ['📞 Yordam']
      ]).resize()
    );
  } catch (error) {
    logger.error('Error handling payment:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// My subscriptions
bot.hears('📊 Mening obunalarim', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      return await ctx.reply('❌ Foydalanuvchi topilmadi.');
    }

    const subscriptions = await Subscription.findAll({
      where: { user_id: user.id },
      include: [{ model: TelegramSession, as: 'session' }],
      order: [['created_at', 'DESC']]
    });

    if (subscriptions.length === 0) {
      return await ctx.reply('📭 Sizda hali obunalar yo\'q.');
    }

    let message = '📊 Sizning obunalaringiz:\n\n';

    subscriptions.forEach((sub: any, index) => {
      const status = sub.status === 'active' ? '✅ Faol' :
                     sub.status === 'expired' ? '❌ Tugagan' : '🔴 Bekor qilingan';

      message += `${index + 1}. ${status}\n`;
      message += `   Tarif: ${sub.plan_type}\n`;
      message += `   Telefon: ${sub.session?.phone_number || 'N/A'}\n`;
      message += `   Boshlanish: ${new Date(sub.start_date).toLocaleDateString()}\n`;
      message += `   Tugash: ${new Date(sub.end_date).toLocaleDateString()}\n\n`;
    });

    await ctx.reply(message);
  } catch (error) {
    logger.error('Error getting subscriptions:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Send message
bot.hears('💬 E\'lon yuborish', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      return await ctx.reply('❌ Foydalanuvchi topilmadi.');
    }

    const subscription = await Subscription.findOne({
      where: { user_id: user.id, status: 'active' }
    });

    if (!subscription) {
      return await ctx.reply('❌ Sizda faol obuna yo\'q. Avval arenda oling.');
    }

    await ctx.reply(
      '📝 E\'loningizni yuboring.\n\n' +
      '⚠️ E\'lon matnida albatta telefon raqamingizni ko\'rsating!\n\n' +
      'Format:\n' +
      '📱 +998901234567\n' +
      'E\'lon matni...'
    );

    userStates.set(ctx.from.id, { state: 'waiting_message' });
  } catch (error) {
    logger.error('Error in send message:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Handle message text
bot.on('text', async (ctx) => {
  try {
    const state = userStates.get(ctx.from.id);

    if (state?.state === 'waiting_message') {
      const text = ctx.message.text;

      // Extract phone number
      const phoneRegex = /(\+998\d{9}|\d{9})/;
      const match = text.match(phoneRegex);

      if (!match) {
        return await ctx.reply('❌ E\'londa telefon raqam topilmadi! Qaytadan yuboring.');
      }

      const phoneNumber = match[0];
      const content = text.replace(phoneNumber, '').trim();

      if (!content) {
        return await ctx.reply('❌ E\'lon matni bo\'sh! Qaytadan yuboring.');
      }

      const telegramId = ctx.from.id.toString();
      const user = await User.findOne({ where: { telegram_id: telegramId } });

      if (!user) {
        return await ctx.reply('❌ Foydalanuvchi topilmadi.');
      }

      const subscription = await Subscription.findOne({
        where: { user_id: user.id, status: 'active' }
      });

      if (!subscription) {
        return await ctx.reply('❌ Faol obuna topilmadi.');
      }

      // Create message
      const message = await Message.create({
        session_id: subscription.session_id,
        user_id: user.id,
        content: content,
        contact_number: phoneNumber,
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
        sessionId: subscription.session_id,
        userId: user.id,
        content: content,
        contactNumber: phoneNumber
      });

      await ctx.reply(
        '✅ E\'loningiz qabul qilindi!\n\n' +
        '🚀 Tez orada guruhlarga tarqatiladi.\n\n' +
        'Jarayon haqida xabar beramiz.',
        Markup.keyboard([
          ['📦 Arenda olish', '📊 Mening obunalarim'],
          ['💬 E\'lon yuborish', '💰 Balans'],
          ['📞 Yordam']
        ]).resize()
      );

      userStates.delete(ctx.from.id);
    }
  } catch (error) {
    logger.error('Error handling text:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Balance
bot.hears('💰 Balans', async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const user = await User.findOne({ where: { telegram_id: telegramId } });

    if (!user) {
      return await ctx.reply('❌ Foydalanuvchi topilmadi.');
    }

    await ctx.reply(`💰 Sizning balansingiz: ${user.balance} so'm`);
  } catch (error) {
    logger.error('Error getting balance:', error);
    await ctx.reply('❌ Xatolik yuz berdi.');
  }
});

// Help
bot.hears('📞 Yordam', async (ctx) => {
  await ctx.reply(
    '📞 Yordam\n\n' +
    'Savollaringiz bo\'lsa @support ga murojaat qiling.\n\n' +
    'Texnik yordam: 24/7'
  );
});

// Back button
bot.hears('🔙 Orqaga', async (ctx) => {
  userStates.delete(ctx.from.id);

  await ctx.reply(
    'Bosh menyu:',
    Markup.keyboard([
      ['📦 Arenda olish', '📊 Mening obunalarim'],
      ['💬 E\'lon yuborish', '💰 Balans'],
      ['📞 Yordam']
    ]).resize()
  );
});

export const startClientBot = async () => {
  try {
    await bot.launch();
    logger.info('✅ Client bot started');
  } catch (error) {
    logger.error('Failed to start client bot:', error);
    throw error;
  }
};

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
