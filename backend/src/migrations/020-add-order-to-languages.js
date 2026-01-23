export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('languages', 'order', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order for languages',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('languages', 'order');
}
