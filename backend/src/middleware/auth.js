import fp from 'fastify-plugin';

async function authPlugin(fastify, options) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.decorate('requireAdmin', async function (request, reply) {
    try {
      // Debug logging
      const authHeader = request.headers.authorization;
      console.log('requireAdmin - Authorization header:', authHeader ? 'present' : 'missing');
      
      await request.jwtVerify();
      
      if (!request.user) {
        console.log('requireAdmin - No user found after JWT verify');
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      if (request.user.role !== 'admin') {
        console.log('requireAdmin - User role:', request.user.role);
        return reply.code(403).send({ error: 'Forbidden: Admin access required' });
      }
      
      console.log('requireAdmin - Authentication successful for admin:', request.user.email);
    } catch (err) {
      console.error('requireAdmin - JWT verification error:', err.message);
      return reply.code(401).send({ error: 'Unauthorized', message: err.message });
    }
  });

  fastify.decorate('requireAdminWithPermission', function (permissionKey) {
    return async function (request, reply) {
      try {
        await request.jwtVerify();
        if (request.user.role !== 'admin') {
          return reply.code(403).send({ error: 'Forbidden: Admin access required' });
        }
        const perms = request.user.permissions || {};
        if (perms[permissionKey] !== true) {
          return reply.code(403).send({ error: `Forbidden: ${permissionKey} permission required` });
        }
      } catch (err) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    };
  });
}

export default fp(authPlugin, {
  name: 'auth-plugin',
});

