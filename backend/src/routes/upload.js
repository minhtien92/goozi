import UploadController from '../controllers/UploadController.js';

async function uploadRoutes(fastify, options) {
  // Upload file (admin only)
  fastify.post('/audio', {
    preHandler: [fastify.requireAdmin],
  }, UploadController.uploadAudio.bind(UploadController));

  // Upload image (admin only)
  fastify.post('/image', {
    preHandler: [fastify.requireAdmin],
  }, UploadController.uploadImage.bind(UploadController));
}

export default uploadRoutes;

