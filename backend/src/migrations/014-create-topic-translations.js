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

  // Add indexes (check if they exist first)
  const tableName = 'topic_translations';
  const indexes = [
    { columns: ['topicId'], name: 'topic_translations_topic_id' },
    { columns: ['languageId'], name: 'topic_translations_language_id' },
    { columns: ['topicId', 'languageId', 'version'], name: 'topic_translations_unique_idx', unique: true },
  ];

  for (const index of indexes) {
    const [results] = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = '${tableName}' 
        AND indexname = '${index.name}'
      );
    `);
    
    if (!results[0].exists) {
      if (index.unique) {
        await queryInterface.addIndex(tableName, index.columns, {
          unique: true,
          name: index.name,
        });
      } else {
        await queryInterface.addIndex(tableName, index.columns, {
          name: index.name,
        });
      }
    }
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('topic_translations');
}

