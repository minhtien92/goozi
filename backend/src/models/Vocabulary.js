import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Vocabulary = sequelize.define(
    'Vocabulary',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      word: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      meaning: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      example: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pronunciation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      topicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'topics',
          key: 'id',
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'vocabularies',
      timestamps: true,
    }
  );

  return Vocabulary;
}

