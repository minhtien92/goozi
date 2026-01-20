import AuthController from '../controllers/AuthController.js';

async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new user',
      description: 'Create a new user account with email, password, and name',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          nativeLanguageId: { type: 'string', format: 'uuid', description: 'Optional: Native language ID' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.register.bind(AuthController));

  // Login
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login with email and password',
      description: 'Authenticate user with email and password, returns JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] },
                permissions: {
                  type: ['object', 'null'],
                  properties: {
                    topics: { type: 'boolean' },
                    vocabularies: { type: 'boolean' },
                    home: { type: 'boolean' },
                    users: { type: 'boolean' },
                  },
                  additionalProperties: false,
                },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.login.bind(AuthController));

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Get current user',
      description: 'Get information about the currently authenticated user',
      security: [{ bearerAuth: [] }],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] },
                nativeLanguageId: { type: 'string', format: 'uuid' },
                learningLanguageIds: {
                  type: 'array',
                  items: { type: 'string', format: 'uuid' },
                },
                voiceAccentVersion: { type: 'integer' },
                nativeLanguage: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    code: { type: 'string' },
                    name: { type: 'string' },
                    nativeName: { type: 'string' },
                    flag: { type: 'string' },
                  },
                },
                permissions: {
                  type: ['object', 'null'],
                  properties: {
                    topics: { type: 'boolean' },
                    vocabularies: { type: 'boolean' },
                    home: { type: 'boolean' },
                    users: { type: 'boolean' },
                  },
                  additionalProperties: false,
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.getCurrentUser.bind(AuthController));

  // Google OAuth login
  fastify.post('/google', {
    schema: {
      tags: ['auth'],
      summary: 'Login with Google OAuth',
      description: 'Authenticate user using Google OAuth ID token',
      body: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { 
            type: 'string', 
            description: 'Google ID token from Google Sign In',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.loginWithGoogle.bind(AuthController));
}

export default authRoutes;
