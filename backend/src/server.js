import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
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
import homeSettingsRoutes from './routes/home-settings.js';
import testimonialsRoutes from './routes/testimonials.js';

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
    'http://web.goozi.org',
    'http://cms.goozi.org',
    'https://web.goozi.org',
    'https://cms.goozi.org',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
});

await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Register Swagger
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Goozi API Documentation',
      description: 'API documentation for Goozi language learning platform',
      version: '1.0.0',
      contact: {
        name: 'Goozi Support',
        email: 'support@goozi.com',
      },
    },
    host: process.env.FRONTEND_URL?.replace('http://', '').replace(':3000', ':3001') || 'localhost:3001',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
      },
    },
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'topics', description: 'Topics management' },
      { name: 'vocabularies', description: 'Vocabularies management' },
      { name: 'users', description: 'User management' },
      { name: 'languages', description: 'Languages management' },
      { name: 'upload', description: 'File upload' },
      { name: 'home-settings', description: 'Home page settings' },
      { name: 'testimonials', description: 'Testimonials management' },
    ],
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/api-docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

await fastify.register(authPlugin);

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(topicsRoutes, { prefix: '/api/topics' });
await fastify.register(vocabulariesRoutes, { prefix: '/api/vocabularies' });
await fastify.register(usersRoutes, { prefix: '/api/users' });
await fastify.register(languagesRoutes, { prefix: '/api/languages' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });
await fastify.register(homeSettingsRoutes, { prefix: '/api/home-settings' });
await fastify.register(testimonialsRoutes, { prefix: '/api/testimonials' });

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

