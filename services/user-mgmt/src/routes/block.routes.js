import blockControllers from "../controllers/block.controllers.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.get("/blocks", blockControllers.getBlocks);
  fastify.post("/blocks/:targetId", blockControllers.blockUser(fastify));
  fastify.delete("/blocks/:targetId", blockControllers.unblockUser(fastify));
};
