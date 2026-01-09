export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('topics', 'order', {
    type: Sequelize.INTEGER,
    allowNull: true,
    comment: 'Thứ tự sắp xếp của topic',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('topics', 'order');
}

