export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('home_settings', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: 'Setting key: slogan, background_image, etc.',
    },
    value: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Setting value (JSON string for complex data)',
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Order for display (for slogans)',
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('home_settings', ['key']);
  await queryInterface.addIndex('home_settings', ['isActive']);
  await queryInterface.addIndex('home_settings', ['order']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('home_settings');
}

