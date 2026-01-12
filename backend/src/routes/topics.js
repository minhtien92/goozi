import TopicController from '../controllers/TopicController.js';

async function topicsRoutes(fastify, options) {
  // Get all topics (public)
  fastify.get('/', {
    schema: {
      tags: ['topics'],
      summary: 'Get all topics',
      description: 'Get a list of all topics with optional filtering and pagination',
      querystring: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean', description: 'Filter by active status' },
          sourceLanguageId: { type: 'string', format: 'uuid', description: 'Filter by source language' },
          targetLanguageId: { type: 'string', format: 'uuid', description: 'Filter by target language' },
          page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            topics: { 
              type: 'array', 
              items: { 
                type: 'object',
                additionalProperties: true,
              } 
            },
            pagination: {
              type: 'object',
              properties: {
                totalItems: { type: 'integer' },
                totalPages: { type: 'integer' },
                currentPage: { type: 'integer' },
                itemsPerPage: { type: 'integer' },
              },
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
      },
    },
  }, TopicController.getAllTopics.bind(TopicController));

  // Get single topic with vocabularies
  fastify.get('/:id', {
    schema: {
      tags: ['topics'],
      summary: 'Get topic by ID',
      description: 'Get a single topic with its vocabularies',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Topic ID' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            topic: { 
              type: 'object',
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, TopicController.getTopicById.bind(TopicController));

  // Create topic (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
    schema: {
      tags: ['topics'],
      summary: 'Create a new topic',
      description: 'Create a new topic (Admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          image: { type: 'string', format: 'uri', description: 'Topic image URL' },
          order: { type: 'integer', description: 'Display order' },
          isActive: { type: 'boolean', default: true },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            topic: { type: 'object' },
          },
        },
        400: {
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
      },
    },
  }, TopicController.createTopic.bind(TopicController));

  // Update topic (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
    schema: {
      tags: ['topics'],
      summary: 'Update a topic',
      description: 'Update an existing topic (Admin only)',
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
          description: { type: 'string' },
          image: { type: 'string', format: 'uri' },
          order: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            topic: { type: 'object' },
          },
        },
        404: {
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
      },
    },
  }, TopicController.updateTopic.bind(TopicController));

  // Delete topic (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
    schema: {
      tags: ['topics'],
      summary: 'Delete a topic',
      description: 'Delete a topic (Admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        404: {
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
      },
    },
  }, TopicController.deleteTopic.bind(TopicController));
}

export default topicsRoutes;
