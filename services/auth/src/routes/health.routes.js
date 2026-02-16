/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify, opts, done) => {
    fastify.get('/health', (request, reply) => {
        return { message: 'healthy' }
    })
    done()
}
