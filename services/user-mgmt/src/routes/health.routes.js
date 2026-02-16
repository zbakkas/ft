/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.get("/health", (request, reply) => {
    return { message: "healthy" };
  });
};
