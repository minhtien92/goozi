import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const TopicTranslation = sequelize.define(
    'TopicTranslation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      topicId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'topics',
          key: 'id',
        },
      },
      languageId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'languages',
          key: 'id',
        },
      },
      meaning: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Tên topic dịch sang ngôn ngữ này',
      },
      ipa: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Phiên âm IPA cho topic',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Phiên bản audio (1-4)',
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL file audio phát âm',
      },
    },
    {
      tableName: 'topic_translations',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['topicId', 'languageId', 'version'],
          name: 'topic_translations_unique_idx',
        },
      ],
    }
  );

  return TopicTranslation;
}

