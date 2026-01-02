export async function up(queryInterface, Sequelize) {
  // Check if column already exists
  const tableDescription = await queryInterface.describeTable('users');
  
  if (!tableDescription.nativeLanguageId) {
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
  }

  // Check if index already exists
  const [indexes] = await queryInterface.sequelize.query(`
    SELECT indexname FROM pg_indexes 
    WHERE tablename = 'users' AND indexname LIKE '%nativeLanguageId%'
  `);
  
  if (indexes.length === 0) {
    await queryInterface.addIndex('users', ['nativeLanguageId']);
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('users', ['nativeLanguageId']);
  await queryInterface.removeColumn('users', 'nativeLanguageId');
}

