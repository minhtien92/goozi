import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const Topic = sequelize.define(
    'Topic',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sourceLanguageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'languages',
          key: 'id',
        },
        comment: 'Ngôn ngữ nguồn (ngôn ngữ chính của người học)',
      },
      targetLanguageId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'languages',
          key: 'id',
        },
        comment: 'Ngôn ngữ đích (ngôn ngữ đang học)',
      },
    },
    {
      tableName: 'topics',
      timestamps: true,
    }
  );

  return Topic;
}

