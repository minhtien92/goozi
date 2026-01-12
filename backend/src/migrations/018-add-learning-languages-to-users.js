export async function up(queryInterface, Sequelize) {
  // Add learningLanguageIds column (JSONB array of language IDs)
  await queryInterface.addColumn('users', 'learningLanguageIds', {
    type: Sequelize.JSONB,
    allowNull: true,
    defaultValue: null,
    comment: 'Array of language IDs that user is learning',
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove learningLanguageIds column
  await queryInterface.removeColumn('users', 'learningLanguageIds');
}
