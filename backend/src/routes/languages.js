import LanguageController from '../controllers/LanguageController.js';

async function languagesRoutes(fastify, options) {
  // Get all languages (public)
  fastify.get('/', LanguageController.getAllLanguages.bind(LanguageController));

  // Get single language
  fastify.get('/:id', LanguageController.getLanguageById.bind(LanguageController));

  // Create language (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, LanguageController.createLanguage.bind(LanguageController));

  // Update language (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
  }, LanguageController.updateLanguage.bind(LanguageController));

  // Delete language (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, LanguageController.deleteLanguage.bind(LanguageController));
}

export default languagesRoutes;

