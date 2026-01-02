export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('vocabularies', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    word: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    meaning: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    example: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    pronunciation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    audioUrl: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    topicId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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

  await queryInterface.addIndex('vocabularies', ['topicId']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('vocabularies');
}

