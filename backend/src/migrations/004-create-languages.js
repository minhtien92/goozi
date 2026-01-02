export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('languages', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    nativeName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    flag: {
      type: Sequelize.STRING,
      allowNull: true,
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

  // Insert default languages using raw query to generate UUIDs
  const sequelize = queryInterface.sequelize;
  await sequelize.query(`
    INSERT INTO languages (id, code, name, "nativeName", flag, "isActive", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid(), 'vi', 'Vietnamese', 'Tiếng Việt', '🇻🇳', true, NOW(), NOW()),
      (gen_random_uuid(), 'en', 'English', 'English', '🇺🇸', true, NOW(), NOW()),
      (gen_random_uuid(), 'ja', 'Japanese', '日本語', '🇯🇵', true, NOW(), NOW()),
      (gen_random_uuid(), 'ko', 'Korean', '한국어', '🇰🇷', true, NOW(), NOW()),
      (gen_random_uuid(), 'zh', 'Chinese', '中文', '🇨🇳', true, NOW(), NOW());
  `);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('languages');
}

