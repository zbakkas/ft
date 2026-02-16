import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/fastify.js";
import { isFriendShipExists } from "../utils/friendship.js";

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getBlocks = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const blocks = await prisma.blockedUser.findMany({
    where: {
      blockerId: userId,
    },
    select: {
      id: true,
      blocked: {
        select: {
          id: true,
          username: true,
        },
      },
      createdAt: true,
    },
  });
  return blocks.map((blocks) => ({
    id: blocks.id,
    userId: blocks.blocked.id,
    username: blocks.blocked.username,
    createdAt: blocks.createdAt,
  }));
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const blockUser = (fastify) => async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const { targetId } = request.params;
  if (userId === targetId)
    return sendError(reply, 400, "USER_CANNOT_BLOCK_SELF");
  // ! replace it
  if (!(await prisma.userProfile.findUnique({ where: { id: targetId } }))) {
    return sendError(reply, 404, "USER_NOT_FOUND");
  }
  if (
    await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetId,
        },
      },
    })
  ) {
    return sendError(reply, 400, "USER_ALREADY_BLOCKED");
  }
  await prisma.blockedUser.create({
    data: {
      blockerId: userId,
      blockedId: targetId,
    },
  });
  const friendshipExists = await isFriendShipExists(userId, targetId);
  if (friendshipExists) {
    await fastify.rabbit.channel.publish(
      "user.events",
      "friendship.blocked",
      Buffer.from(
        JSON.stringify({
          requesterId: userId,
          receiverId: targetId,
        })
      ),
      {
        persistent: true,
      }
    );
  }
  return sendSuccess(reply, 200, "USER_BLOCKED_SUCCESS");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const unblockUser = (fastify) => async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const { targetId } = request.params;
  const blocked = await prisma.blockedUser.findUnique({
    where: {
      blockerId_blockedId: {
        blockedId: targetId,
        blockerId: userId,
      },
    },
  });
  if (!blocked) {
    return sendError(reply, 404, "NOT_FOUND");
  }
  await prisma.blockedUser.delete({
    where: {
      blockerId_blockedId: { blockedId: targetId, blockerId: userId },
    },
  });
  const friendshipExists = await isFriendShipExists(userId, targetId);
  if (friendshipExists) {
    await fastify.rabbit.channel.publish(
      "user.events",
      "friendship.unblocked",
      Buffer.from(
        JSON.stringify({
          requesterId: userId,
          receiverId: blocked.blockedId,
        })
      ),
      {
        persistent: true,
      }
    );
  }
  return sendSuccess(reply, 200, "USER_UNBLOCKED_SUCCESS");
};

export default { getBlocks, blockUser, unblockUser };
