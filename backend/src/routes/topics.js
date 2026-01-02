import TopicController from '../controllers/TopicController.js';

async function topicsRoutes(fastify, options) {
  // Get all topics (public)
  fastify.get('/', TopicController.getAllTopics.bind(TopicController));

  // Get single topic with vocabularies
  fastify.get('/:id', TopicController.getTopicById.bind(TopicController));

  // Create topic (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, TopicController.createTopic.bind(TopicController));

  // Update topic (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
  }, TopicController.updateTopic.bind(TopicController));

  // Delete topic (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, TopicController.deleteTopic.bind(TopicController));
}

export default topicsRoutes;
