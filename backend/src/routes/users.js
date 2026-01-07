import UserController from '../controllers/UserController.js';

async function usersRoutes(fastify, options) {
  // Get all users (admin only)
  fastify.get('/', {
    preHandler: [fastify.requireAdmin],
  }, UserController.getAllUsers.bind(UserController));

  // Create user (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, UserController.createUser.bind(UserController));

  // Get single user (admin only)
  fastify.get('/:id', {
    preHandler: [fastify.requireAdmin],
  }, UserController.getUserById.bind(UserController));

  // Update user (admin can update anyone, user can update themselves)
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
  }, UserController.updateUser.bind(UserController));

  // Delete user (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, UserController.deleteUser.bind(UserController));
}

export default usersRoutes;
