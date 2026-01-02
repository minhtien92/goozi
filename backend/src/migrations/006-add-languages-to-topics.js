export async function up(queryInterface, Sequelize) {
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

  await queryInterface.addIndex('topics', ['sourceLanguageId']);
  await queryInterface.addIndex('topics', ['targetLanguageId']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('topics', ['sourceLanguageId']);
  await queryInterface.removeIndex('topics', ['targetLanguageId']);
  await queryInterface.removeColumn('topics', 'sourceLanguageId');
  await queryInterface.removeColumn('topics', 'targetLanguageId');
}

