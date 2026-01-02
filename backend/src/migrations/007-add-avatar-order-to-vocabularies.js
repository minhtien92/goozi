export async function up(queryInterface, Sequelize) {
  // Check if columns already exist
  const tableDescription = await queryInterface.describeTable('vocabularies');
  
  if (!tableDescription.avatar) {
    await queryInterface.addColumn('vocabularies', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }

  if (!tableDescription.order) {
    await queryInterface.addColumn('vocabularies', 'order', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('vocabularies', 'avatar');
  await queryInterface.removeColumn('vocabularies', 'order');
}

