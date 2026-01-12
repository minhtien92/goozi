export async function up(queryInterface, Sequelize) {
  // Add googleId column
  await queryInterface.addColumn('users', 'googleId', {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
    comment: 'Google OAuth ID',
  });

  // Make password nullable (for Google OAuth users)
  await queryInterface.changeColumn('users', 'password', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove googleId column
  await queryInterface.removeColumn('users', 'googleId');

  // Make password required again
  await queryInterface.changeColumn('users', 'password', {
    type: Sequelize.STRING,
    allowNull: false,
  });
}
