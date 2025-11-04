import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PricingPlanAttributes {
  id: string;
  plan_type: 'daily' | 'weekly' | 'monthly';
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface PricingPlanCreationAttributes extends Optional<PricingPlanAttributes, 'id' | 'created_at' | 'updated_at'> {}

class PricingPlan extends Model<PricingPlanAttributes, PricingPlanCreationAttributes> implements PricingPlanAttributes {
  public id!: string;
  public plan_type!: 'daily' | 'weekly' | 'monthly';
  public price!: number;
  public duration_days!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PricingPlan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    plan_type: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
      unique: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration_days: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'pricing_plans',
    timestamps: true,
    underscored: true
  }
);

export default PricingPlan;
