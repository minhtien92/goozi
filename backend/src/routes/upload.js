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
      
      if (request.user.role !== 'admin') {
        console.log('Upload route - User role:', request.user.role);
        return reply.code(403).send({ error: 'Forbidden: Admin access required' });
      }
      
      console.log('Upload route - JWT verified successfully for admin:', request.user.email);
    } catch (err) {
      console.error('Upload route - JWT verification error:', err.message);
      return reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  };

  // Upload file (admin only)
  fastify.post('/audio', {
    onRequest: [verifyJWTBeforeMultipart],
  }, UploadController.uploadAudio.bind(UploadController));

  // Upload image (admin only)
  fastify.post('/image', {
    onRequest: [verifyJWTBeforeMultipart],
  }, UploadController.uploadImage.bind(UploadController));
}

export default uploadRoutes;

