import usersControllers from "../controllers/users.controllers.js";
import { updateUserSchema } from "../schemas/users.schemas.js";
import { bodyValidator } from "../utils/validators.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.get("/me", usersControllers.showMyProfile);
  fastify.put("/me/avatar", usersControllers.updateMyAvatar);
  fastify.get("/me/avatar", usersControllers.showMyAvatar);
  fastify.get("/@:username/avatar", usersControllers.showUserAvatar);
  fastify.patch(
    "/me",
    {
      preValidation: [bodyValidator(updateUserSchema)],
    },
    usersControllers.updateMyProfile
  );
  fastify.get("/users", usersControllers.searchUsers);
  fastify.get("/@:username", usersControllers.getUserByUsername);
  fastify.get("/:userId", usersControllers.getUserById);
};
