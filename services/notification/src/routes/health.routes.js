/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify) => {
  fastify.get("/", (request, reply) => {
    return { message: "healthy" };
  });
};
