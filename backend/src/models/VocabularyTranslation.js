import { DataTypes } from 'sequelize';

export default function (sequelize) {
  const VocabularyTranslation = sequelize.define(
    'VocabularyTranslation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vocabularyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'vocabularies',
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
      },
      pronunciation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      example: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      audioUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Version number: 1, 2, 3, 4 (V1, V2, V3, V4)',
      },
    },
    {
      tableName: 'vocabulary_translations',
      timestamps: true,
    }
  );

  return VocabularyTranslation;
}

