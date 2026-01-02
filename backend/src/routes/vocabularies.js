import VocabularyController from '../controllers/VocabularyController.js';

async function vocabulariesRoutes(fastify, options) {
  // Get all vocabularies (with optional topic filter)
  fastify.get('/', VocabularyController.getAllVocabularies.bind(VocabularyController));

  // Get single vocabulary
  fastify.get('/:id', VocabularyController.getVocabularyById.bind(VocabularyController));

  // Create vocabulary (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, VocabularyController.createVocabulary.bind(VocabularyController));

  // Update vocabulary (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
  }, VocabularyController.updateVocabulary.bind(VocabularyController));

  // Delete vocabulary (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, VocabularyController.deleteVocabulary.bind(VocabularyController));
}

export default vocabulariesRoutes;
