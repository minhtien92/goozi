export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'nativeLanguageId', {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'languages',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('users', ['nativeLanguageId']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('users', ['nativeLanguageId']);
  await queryInterface.removeColumn('users', 'nativeLanguageId');
}

