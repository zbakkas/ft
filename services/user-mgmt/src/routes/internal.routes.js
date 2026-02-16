import internalControllers from "../controllers/internal.controllers.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.post("/profiles", internalControllers.createUserProfile);
  fastify.post("/username-available", internalControllers.isUsernameAvailable);
  fastify.post(
    "/chat/permissions/:userId/:targetUserId",
    internalControllers.checkChatPermission
  );
  fastify.post("/friends/:userId", internalControllers.getFriendsOfUser);
  fastify.get("/friendships", internalControllers.getFriendships);
  fastify.get("/blocks", internalControllers.getBlocks);
  fastify.get("/users/:userId", internalControllers.getUserById);
};
