import HomeSettingController from '../controllers/HomeSettingController.js';

async function homeSettingsRoutes(fastify, options) {
  // Get all settings (admin only)
  fastify.get('/', {
    preHandler: [fastify.requireAdmin],
  }, HomeSettingController.getAllSettings.bind(HomeSettingController));

  // Get active settings (public)
  fastify.get('/active', HomeSettingController.getActiveSettings.bind(HomeSettingController));

  // Get setting by key (public)
  fastify.get('/:key', HomeSettingController.getSettingByKey.bind(HomeSettingController));

  // Create or update setting (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdmin],
  }, HomeSettingController.createOrUpdateSetting.bind(HomeSettingController));

  // Update setting (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdmin],
  }, HomeSettingController.updateSetting.bind(HomeSettingController));

  // Delete setting (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdmin],
  }, HomeSettingController.deleteSetting.bind(HomeSettingController));

  // Bulk update slogans (admin only)
  fastify.post('/slogans/bulk', {
    preHandler: [fastify.requireAdmin],
  }, HomeSettingController.bulkUpdateSlogans.bind(HomeSettingController));
}

export default homeSettingsRoutes;

