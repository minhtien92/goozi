import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const HomeSetting = sequelize.define(
    'HomeSetting',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Setting key: slogan, background_image, etc.',
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Setting value (JSON string for complex data)',
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'home_settings',
      timestamps: true,
    }
  );

  return HomeSetting;
}

