export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('testimonials', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Name of the person giving testimonial',
    },
    quote: {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: 'Testimonial quote/text',
    },
    order: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Order for display',
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

  await queryInterface.addIndex('testimonials', ['order']);
  await queryInterface.addIndex('testimonials', ['isActive']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('testimonials');
}

