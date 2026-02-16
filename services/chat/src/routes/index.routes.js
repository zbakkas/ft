import conversationRoutes from './conversation.routes.js'
import socketRoutes from './socket.routes.js'

/**
 * @type {import('fastify').FastifyPluginAsync}
 */
export default async (fastify, opts) => {
    await fastify.register(socketRoutes, { prefix: '/' })
    await fastify.register(conversationRoutes, { prefix: '/' })
}
