import UploadController from '../controllers/UploadController.js';

async function uploadRoutes(fastify, options) {
  // Helper to verify JWT before multipart parsing
  const verifyJWTBeforeMultipart = async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      console.log('Upload route - Authorization header:', authHeader ? 'present' : 'missing');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Upload route - No valid authorization header');
        return reply.code(401).send({ error: 'Unauthorized', message: 'No authorization header' });
      }

      // Use jwtVerify which is the proper way in Fastify
      await request.jwtVerify();

      if (!request.user) {
        console.log('Upload route - No user after JWT verify');
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      console.log('Upload route - JWT verified successfully for:', request.user.email);
    } catch (err) {
      console.error('Upload route - JWT verification error:', err.message);
      return reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  };

  // Upload file (authenticated)
  fastify.post('/audio', {
    onRequest: [verifyJWTBeforeMultipart],
  }, UploadController.uploadAudio.bind(UploadController));

  // Upload image (authenticated)
  fastify.post('/image', {
    onRequest: [verifyJWTBeforeMultipart],
  }, UploadController.uploadImage.bind(UploadController));
}

export default uploadRoutes;

