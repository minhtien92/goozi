import AuthController from '../controllers/AuthController.js';

async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', AuthController.register.bind(AuthController));

  // Login
  fastify.post('/login', AuthController.login.bind(AuthController));

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, AuthController.getCurrentUser.bind(AuthController));
}

export default authRoutes;
