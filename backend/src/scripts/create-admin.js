import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'goozi_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const email = process.env.ADMIN_EMAIL || 'admin@goozi.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const [existing] = await sequelize.query(
      `SELECT id FROM users WHERE email = :email`,
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await sequelize.query(
        `UPDATE users SET password = :password, role = 'admin', name = :name WHERE email = :email`,
        {
          replacements: { password: hashedPassword, name, email },
        }
      );
      console.log(`✅ Admin user updated successfully!`);
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      await sequelize.query(
        `INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), :email, :password, :name, 'admin', NOW(), NOW())`,
        {
          replacements: { email, password: hashedPassword, name },
        }
      );
      console.log(`✅ Admin user created successfully!`);
    }

    console.log('\n📧 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Please change the default password after first login!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

createAdmin();

