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
      await request.jwtVerify();
      if (request.user.role !== 'admin') {
        reply.code(403).send({ error: 'Forbidden: Admin access required' });
      }
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
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

