import sequelize from '../config/database';
import User from './User';
import TelegramSession from './TelegramSession';
import Subscription from './Subscription';
import Message from './Message';
import SessionGroup from './SessionGroup';
import Payment from './Payment';
import PricingPlan from './PricingPlan';

// Define relationships
User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TelegramSession.hasMany(Subscription, { foreignKey: 'session_id', as: 'subscriptions' });
Subscription.belongsTo(TelegramSession, { foreignKey: 'session_id', as: 'session' });

TelegramSession.hasMany(Message, { foreignKey: 'session_id', as: 'messages' });
Message.belongsTo(TelegramSession, { foreignKey: 'session_id', as: 'session' });

User.hasMany(Message, { foreignKey: 'user_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

TelegramSession.hasMany(SessionGroup, { foreignKey: 'session_id', as: 'groups' });
SessionGroup.belongsTo(TelegramSession, { foreignKey: 'session_id', as: 'session' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Subscription.hasMany(Payment, { foreignKey: 'subscription_id', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

export {
  sequelize,
  User,
  TelegramSession,
  Subscription,
  Message,
  SessionGroup,
  Payment,
  PricingPlan
};

export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models (without alter in production to avoid schema conflicts)
    await sequelize.sync();
    console.log('✅ All models synchronized successfully.');

    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    return false;
  }
};
