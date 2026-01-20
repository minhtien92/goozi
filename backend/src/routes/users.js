import UserController from '../controllers/UserController.js';

async function usersRoutes(fastify, options) {
  // Get all users (admin only)
  fastify.get('/', {
    preHandler: [fastify.requireAdminWithPermission('users')],
  }, UserController.getAllUsers.bind(UserController));

  // Create user (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdminWithPermission('users')],
  }, UserController.createUser.bind(UserController));

  // Get single user (admin only)
  fastify.get('/:id', {
    preHandler: [fastify.requireAdminWithPermission('users')],
  }, UserController.getUserById.bind(UserController));

  // Update user (admin can update anyone, user can update themselves)
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['users'],
      summary: 'Update a user',
      description: 'Update user information (Admin can update anyone, user can update themselves)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'user'] },
          nativeLanguageId: { type: 'string', format: 'uuid' },
          permissions: {
            type: 'object',
            properties: {
              topics: { type: 'boolean' },
              vocabularies: { type: 'boolean' },
              home: { type: 'boolean' },
              users: { type: 'boolean' },
            },
            additionalProperties: false,
          },
          voiceAccentVersion: { type: 'integer' },
          learningLanguageIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: { type: 'object' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, UserController.updateUser.bind(UserController));

  // Delete user (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdminWithPermission('users')],
  }, UserController.deleteUser.bind(UserController));
}

export default usersRoutes;
