import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SubscriptionAttributes {
  id: string;
  user_id: string;
  session_id: string;
  plan_type: 'daily' | 'weekly' | 'monthly';
  price: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'expired' | 'cancelled';
  auto_renew: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: string;
  public user_id!: string;
  public session_id!: string;
  public plan_type!: 'daily' | 'weekly' | 'monthly';
  public price!: number;
  public start_date!: Date;
  public end_date!: Date;
  public status!: 'active' | 'expired' | 'cancelled';
  public auto_renew!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'telegram_sessions',
        key: 'id'
      }
    },
    plan_type: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      allowNull: false
    },
    auto_renew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true
  }
);

export default Subscription;
