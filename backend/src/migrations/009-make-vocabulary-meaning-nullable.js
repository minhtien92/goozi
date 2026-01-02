export async function up(queryInterface, Sequelize) {
  // Check if meaning column exists and is not nullable
  const tableDescription = await queryInterface.describeTable('vocabularies');
  
  if (tableDescription.meaning && !tableDescription.meaning.allowNull) {
    // Change meaning column to nullable since meaning is now stored in vocabulary_translations
    await queryInterface.changeColumn('vocabularies', 'meaning', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
}

export async function down(queryInterface, Sequelize) {
  // Revert back to not null (but this might fail if there are null values)
  await queryInterface.changeColumn('vocabularies', 'meaning', {
    type: Sequelize.TEXT,
    allowNull: false,
  });
}

