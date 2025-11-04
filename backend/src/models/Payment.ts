import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PaymentAttributes {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  payment_method: 'card';
  status: 'pending' | 'confirmed' | 'rejected';
  receipt_photo?: string;
  admin_note?: string;
  confirmed_by?: string;
  confirmed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: string;
  public user_id!: string;
  public subscription_id?: string;
  public amount!: number;
  public payment_method!: 'card';
  public status!: 'pending' | 'confirmed' | 'rejected';
  public receipt_photo?: string;
  public admin_note?: string;
  public confirmed_by?: string;
  public confirmed_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Payment.init(
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
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'subscriptions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('card'),
      defaultValue: 'card',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    receipt_photo: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    confirmed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'payments',
    timestamps: true,
    underscored: true
  }
);

export default Payment;
