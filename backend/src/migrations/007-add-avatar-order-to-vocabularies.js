export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('vocabularies', 'avatar', {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn('vocabularies', 'order', {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('vocabularies', 'avatar');
  await queryInterface.removeColumn('vocabularies', 'order');
}

