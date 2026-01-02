export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('vocabulary_translations', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    vocabularyId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'vocabularies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    languageId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'languages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    meaning: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    pronunciation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    example: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    audioUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Version number: 1, 2, 3, 4 (V1, V2, V3, V4)',
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('vocabulary_translations', ['vocabularyId']);
  await queryInterface.addIndex('vocabulary_translations', ['languageId']);
  await queryInterface.addIndex('vocabulary_translations', ['vocabularyId', 'languageId', 'version'], {
    unique: true,
    name: 'vocabulary_translations_unique',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('vocabulary_translations');
}

