import { Router } from 'express';
import { Payment } from '../models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const payments = await Payment.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, amount, receipt_photo } = req.body;

    const payment = await Payment.create({
      user_id,
      amount,
      payment_method: 'card',
      status: 'pending',
      receipt_photo
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, admin_note } = req.body;

    await Payment.update(
      { status: 'confirmed', confirmed_by: admin_id, confirmed_at: new Date(), admin_note },
      { where: { id } }
    );

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
