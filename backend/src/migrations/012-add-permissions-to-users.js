export async function up(queryInterface, Sequelize) {
  const tableDescription = await queryInterface.describeTable('users');

  if (!tableDescription.permissions) {
    await queryInterface.addColumn('users', 'permissions', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  }
}

export async function down(queryInterface, Sequelize) {
  const tableDescription = await queryInterface.describeTable('users');

  if (tableDescription.permissions) {
    await queryInterface.removeColumn('users', 'permissions');
  }
}


