export async function up(queryInterface, Sequelize) {
  // Remove foreign key constraints first
  await queryInterface.removeConstraint('topics', 'topics_sourceLanguageId_fkey');
  await queryInterface.removeConstraint('topics', 'topics_targetLanguageId_fkey');
  
  // Remove columns
  await queryInterface.removeColumn('topics', 'sourceLanguageId');
  await queryInterface.removeColumn('topics', 'targetLanguageId');
}

export async function down(queryInterface, Sequelize) {
  // Add columns back
  await queryInterface.addColumn('topics', 'sourceLanguageId', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'languages',
      key: 'id',
    },
    comment: 'Ngôn ngữ nguồn (ngôn ngữ chính của người học)',
  });
  
  await queryInterface.addColumn('topics', 'targetLanguageId', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'languages',
      key: 'id',
    },
    comment: 'Ngôn ngữ đích (ngôn ngữ đang học)',
  });
}

