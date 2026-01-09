export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('topic_translations', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    topicId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'topics',
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
      comment: 'Tên topic dịch sang ngôn ngữ này',
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Phiên bản audio (1-4)',
    },
    audioUrl: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'URL file audio phát âm',
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

  // Add indexes
  await queryInterface.addIndex('topic_translations', ['topicId']);
  await queryInterface.addIndex('topic_translations', ['languageId']);
  await queryInterface.addIndex('topic_translations', ['topicId', 'languageId', 'version'], {
    unique: true,
    name: 'topic_translations_unique_idx',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('topic_translations');
}

