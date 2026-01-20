import HomeSettingController from '../controllers/HomeSettingController.js';

async function homeSettingsRoutes(fastify, options) {
  // Get all settings (admin only)
  fastify.get('/', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.getAllSettings.bind(HomeSettingController));

  // Get active settings (public)
  fastify.get('/active', HomeSettingController.getActiveSettings.bind(HomeSettingController));

  // Create new setting (admin only) - always creates new, doesn't update
  // MUST be before /:key route to avoid route conflict
  fastify.post('/create', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.createSetting.bind(HomeSettingController));

  // Bulk update slogans (admin only)
  // MUST be before /:key route to avoid route conflict
  fastify.post('/slogans/bulk', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.bulkUpdateSlogans.bind(HomeSettingController));

  // Get setting by key (public)
  // MUST be after specific routes to avoid conflicts
  fastify.get('/:key', HomeSettingController.getSettingByKey.bind(HomeSettingController));

  // Create or update setting (admin only)
  fastify.post('/', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.createOrUpdateSetting.bind(HomeSettingController));

  // Update setting (admin only)
  fastify.put('/:id', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.updateSetting.bind(HomeSettingController));

  // Delete setting (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.requireAdminWithPermission('home')],
  }, HomeSettingController.deleteSetting.bind(HomeSettingController));
}

export default homeSettingsRoutes;

