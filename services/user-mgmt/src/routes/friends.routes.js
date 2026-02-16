import friendsControllers from "../controllers/friends.controllers.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.get("/friends", friendsControllers.getFriends);

  fastify.post("/friends/:targetUserId/add", friendsControllers.addFriend(fastify));

  fastify.patch(
    "/friends/:targetUserId/:action",
    friendsControllers.updateFriendRequest(fastify)
  );
};
