import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SessionGroupAttributes {
  id: string;
  session_id: string;
  group_id: string;
  group_title: string;
  group_username?: string;
  is_active: boolean;
  has_restrictions: boolean;
  has_delete_bot: boolean;
  last_message_at?: Date;
  message_count: number;
  created_at?: Date;
  updated_at?: Date;
}

interface SessionGroupCreationAttributes extends Optional<SessionGroupAttributes, 'id' | 'created_at' | 'updated_at'> {}

class SessionGroup extends Model<SessionGroupAttributes, SessionGroupCreationAttributes> implements SessionGroupAttributes {
  public id!: string;
  public session_id!: string;
  public group_id!: string;
  public group_title!: string;
  public group_username?: string;
  public is_active!: boolean;
  public has_restrictions!: boolean;
  public has_delete_bot!: boolean;
  public last_message_at?: Date;
  public message_count!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SessionGroup.init(
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
    group_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    group_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    group_username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    has_restrictions: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_delete_bot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    message_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
    tableName: 'session_groups',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['session_id', 'group_id']
      }
    ]
  }
);

export default SessionGroup;
