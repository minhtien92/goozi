import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import db from './models/index.js';
import authPlugin from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import topicsRoutes from './routes/topics.js';
import vocabulariesRoutes from './routes/vocabularies.js';
import usersRoutes from './routes/users.js';
import languagesRoutes from './routes/languages.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.CMS_URL || 'http://localhost:3002',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://web:3000',
    'http://cms:3002',
  ],
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

await fastify.register(authPlugin);

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(topicsRoutes, { prefix: '/api/topics' });
await fastify.register(vocabulariesRoutes, { prefix: '/api/vocabularies' });
await fastify.register(usersRoutes, { prefix: '/api/users' });
await fastify.register(languagesRoutes, { prefix: '/api/languages' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });

// Serve static files (uploads)
fastify.register(import('@fastify/static'), {
  root: join(dirname(fileURLToPath(import.meta.url)), '..', 'uploads'),
  prefix: '/uploads/',
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    // Create uploads directory if it doesn't exist
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const uploadsDir = join(__dirname, '..', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('Uploads directory ready.');
    } catch (err) {
      console.warn('Could not create uploads directory:', err.message);
    }

    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database (only in development)
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: false });
      console.log('Database models synchronized.');
    }

    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

