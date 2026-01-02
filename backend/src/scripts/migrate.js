import { Sequelize, DataTypes } from 'sequelize';
import { pathToFileURL } from 'url';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'goozi_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

async function runMigrations() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Create SequelizeMeta table if it doesn't exist
    const queryInterface = sequelize.getQueryInterface();
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeMeta'
      );
    `);
    
    if (!results[0].exists) {
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true,
        },
      });
      console.log('SequelizeMeta table created.');
    }

    // Get executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name ASC'
    );
    const executedNames = executedMigrations.map((m) => m.name);

    // Read migration files
    const migrationsPath = join(__dirname, '../migrations');
    const files = await readdir(migrationsPath);
    const migrationFiles = files
      .filter((file) => file.endsWith('.js'))
      .sort();

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedNames.includes(file)) {
        console.log(`✓ ${file} already executed`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const migrationPath = join(migrationsPath, file);
      const migrationUrl = pathToFileURL(migrationPath).href;
      const migration = await import(migrationUrl);
      
      try {
        const qInterface = sequelize.getQueryInterface();
        await migration.up(qInterface, Sequelize);
        
        // Record migration
        await sequelize.query(
          `INSERT INTO "SequelizeMeta" (name) VALUES ('${file.replace(/'/g, "''")}')`
        );
        console.log(`✓ ${file} completed`);
      } catch (error) {
        console.error(`✗ ${file} failed:`, error.message);
        console.error(error);
        throw error;
      }
    }

    console.log('All migrations completed successfully.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigrations();

