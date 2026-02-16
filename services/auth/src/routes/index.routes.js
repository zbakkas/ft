import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import twoFactorRoutes from './twoFactor.routes.js';
import oauthRoutes from './oauth.routes.js';

/**
 * @type {import('fastify').FastifyPluginAsync}
 */
const indexRoute = async (fastify, opts) => {
    await fastify.register(healthRoutes, { prefix: '/' })
    await fastify.register(authRoutes, { prefix: '/' })
    await fastify.register(twoFactorRoutes, { prefix: '/2fa' })
    await fastify.register(oauthRoutes, { prefix: '/oauth' })
};

export default indexRoute;
