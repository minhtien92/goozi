export async function up(queryInterface, Sequelize) {
  // Check if columns already exist
  const tableDescription = await queryInterface.describeTable('topics');
  
  if (!tableDescription.sourceLanguageId) {
    await queryInterface.addColumn('topics', 'sourceLanguageId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'languages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Ngôn ngữ nguồn (ngôn ngữ chính của người học)',
    });
  }

  if (!tableDescription.targetLanguageId) {
    await queryInterface.addColumn('topics', 'targetLanguageId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'languages',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Ngôn ngữ đích (ngôn ngữ đang học)',
    });
  }

  // Check if indexes already exist
  const [indexes] = await queryInterface.sequelize.query(`
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'topics' AND (indexname LIKE '%sourceLanguageId%' OR indexname LIKE '%targetLanguageId%')
  `);
  
  const indexNames = indexes.map(idx => idx.indexname);
  
  if (!indexNames.some(name => name.includes('sourceLanguageId'))) {
    await queryInterface.addIndex('topics', ['sourceLanguageId']);
  }
  
  if (!indexNames.some(name => name.includes('targetLanguageId'))) {
    await queryInterface.addIndex('topics', ['targetLanguageId']);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('topics', ['sourceLanguageId']);
  await queryInterface.removeIndex('topics', ['targetLanguageId']);
  await queryInterface.removeColumn('topics', 'sourceLanguageId');
  await queryInterface.removeColumn('topics', 'targetLanguageId');
}

