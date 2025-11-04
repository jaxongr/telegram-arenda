import { Router } from 'express';
import { Subscription, TelegramSession, PricingPlan } from '../models';
import logger from '../config/logger';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id;

    const subscriptions = await Subscription.findAll({
      where,
      include: [{ model: TelegramSession, as: 'session' }],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: subscriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, plan_type } = req.body;

    const plan = await PricingPlan.findOne({ where: { plan_type, is_active: true } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    const availableSession = await TelegramSession.findOne({
      where: { status: 'available', is_healthy: true }
    });

    if (!availableSession) {
      return res.status(404).json({ success: false, error: 'No available sessions' });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user_id,
      session_id: availableSession.id,
      plan_type,
      price: plan.price,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    });

    await TelegramSession.update(
      { status: 'rented', current_user_id: user_id },
      { where: { id: availableSession.id } }
    );

    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    logger.error('Failed to create subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
