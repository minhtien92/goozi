export async function up(queryInterface, Sequelize) {
  // Remove unique constraint from key column
  try {
    // Find the unique constraint name
    const [results] = await queryInterface.sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'public'
      AND table_name = 'home_settings' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%key%'
    `);
    
    if (results && results.length > 0) {
      for (const result of results) {
        const constraintName = result.constraint_name;
        await queryInterface.sequelize.query(`
          ALTER TABLE home_settings DROP CONSTRAINT IF EXISTS "${constraintName}"
        `);
        console.log(`Removed unique constraint: ${constraintName}`);
      }
    }
  } catch (error) {
    console.log('No unique constraint found or already removed:', error.message);
  }
}

export async function down(queryInterface, Sequelize) {
  // Re-add unique constraint (if needed)
  await queryInterface.addConstraint('home_settings', {
    fields: ['key'],
    type: 'unique',
    name: 'home_settings_key_unique'
  });
}

