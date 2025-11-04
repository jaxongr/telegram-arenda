import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageAttributes {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  contact_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_groups: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public session_id!: string;
  public user_id!: string;
  public content!: string;
  public contact_number!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public total_groups!: number;
  public sent_count!: number;
  public failed_count!: number;
  public skipped_count!: number;
  public started_at?: Date;
  public completed_at?: Date;
  public error_message?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'telegram_sessions',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    total_groups: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sent_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    failed_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    skipped_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
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
    tableName: 'messages',
    timestamps: true,
    underscored: true
  }
);

export default Message;
