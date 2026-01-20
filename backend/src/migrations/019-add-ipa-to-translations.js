export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('topic_translations', 'ipa', {
    type: Sequelize.STRING,
    allowNull: true,
    comment: 'IPA pronunciation for the topic in this language',
  });

  await queryInterface.addColumn('vocabulary_translations', 'ipa', {
    type: Sequelize.STRING,
    allowNull: true,
    comment: 'IPA pronunciation for the word in this language',
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('topic_translations', 'ipa');
  await queryInterface.removeColumn('vocabulary_translations', 'ipa');
}

