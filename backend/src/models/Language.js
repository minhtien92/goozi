import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Language = sequelize.define(
    'Language',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        comment: 'Language code (vi, en, ja, ko, etc.)',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Language name (Vietnamese, English, Japanese, Korean, etc.)',
      },
      nativeName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Native name (Tiếng Việt, English, 日本語, 한국어, etc.)',
      },
      flag: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Flag emoji or icon URL',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'languages',
      timestamps: true,
    }
  );

  return Language;
}

