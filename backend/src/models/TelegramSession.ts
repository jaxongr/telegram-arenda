import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SessionAttributes {
  id: string;
  phone_number: string;
  session_string?: string;
  status: 'available' | 'rented' | 'blocked' | 'spam' | 'disconnected';
  current_user_id?: string;
  groups_count: number;
  messages_sent_today: number;
  last_message_at?: Date;
  last_health_check?: Date;
  is_healthy: boolean;
  ban_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'created_at' | 'updated_at'> {}

class TelegramSession extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: string;
  public phone_number!: string;
  public session_string?: string;
  public status!: 'available' | 'rented' | 'blocked' | 'spam' | 'disconnected';
  public current_user_id?: string;
  public groups_count!: number;
  public messages_sent_today!: number;
  public last_message_at?: Date;
  public last_health_check?: Date;
  public is_healthy!: boolean;
  public ban_reason?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TelegramSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    session_string: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('available', 'rented', 'blocked', 'spam', 'disconnected'),
      defaultValue: 'available',
      allowNull: false
    },
    current_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    groups_count: {
      type: DataTypes.INTEGER,
      defaultValue: 250
    },
    messages_sent_today: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_health_check: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_healthy: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ban_reason: {
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
    tableName: 'telegram_sessions',
    timestamps: true,
    underscored: true
  }
);

export default TelegramSession;
