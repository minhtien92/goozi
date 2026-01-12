export async function up(queryInterface, Sequelize) {
  // Add voiceAccentVersion column (1, 2, 3, or 4, default 1)
  await queryInterface.addColumn('users', 'voiceAccentVersion', {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 1,
    comment: 'Voice accent version preference (1-4)',
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove voiceAccentVersion column
  await queryInterface.removeColumn('users', 'voiceAccentVersion');
}
