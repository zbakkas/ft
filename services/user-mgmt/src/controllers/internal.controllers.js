import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/fastify.js";

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const createUserProfile = async (request, reply) => {
  const { userId, username } = request.body;
  const userExists = await prisma.userProfile.findUnique({
    where: {
      id: userId,
    },
  });
  if (userExists)
    return sendSuccess(reply, 201, "USER_PROFILE_CREATED_SUCCESS");
  const user = await prisma.userProfile.create({
    data: {
      id: userId,
      username,
    },
  });
  return sendSuccess(reply, 201, "USER_PROFILE_CREATED_SUCCESS");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const isUsernameAvailable = async (request, reply) => {
  const { username } = request.body;
  const user = await prisma.userProfile.findUnique({
    where: {
      username,
    },
  });
  if (user) return sendError(reply, 409, "USERNAME_TAKEN");
  return sendSuccess(reply, 200, "USERNAME_AVAILABLE");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const checkChatPermission = async (request, reply) => {
  const { userId, targetUserId } = request.params;
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        {
          requesterId: userId,
          receiverId: targetUserId,
        },
        {
          requesterId: targetUserId,
          receiverId: userId,
        },
      ],
      NOT: [
        {
          requester: { BlockedUsers: { some: { blockedId: userId } } },
        },
        {
          receiver: { BlockedUsers: { some: { blockedId: userId } } },
        },
        {
          requester: { BlockedByUsers: { some: { blockerId: userId } } },
        },
        {
          receiver: { BlockedByUsers: { some: { blockerId: userId } } },
        },
      ],
    },
  });
  if (!friendship) return sendError(reply, 401, "");
  return sendSuccess(reply, 200, "");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getFriendsOfUser = async (request, reply) => {
  const { userId } = request.params;
  const res = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [
        {
          requesterId: userId,
        },
        {
          receiverId: userId,
        },
      ],
      NOT: [
        {
          requester: { BlockedUsers: { some: { blockedId: userId } } },
        },
        {
          receiver: { BlockedUsers: { some: { blockedId: userId } } },
        },
        {
          requester: { BlockedByUsers: { some: { blockerId: userId } } },
        },
        {
          receiver: { BlockedByUsers: { some: { blockerId: userId } } },
        },
      ],
    },
    select: {
      requester: {
        select: {
          id: true,
        },
      },
      receiver: {
        select: {
          id: true,
        },
      },
    },
  });
  return res.map((f) =>
    f.requester.id === userId ? f.receiver.id : f.requester.id
  );
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getFriendships = async (request, reply) => {
  const friendships = await prisma.friendship.findMany();
  return friendships;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getBlocks = async (request, reply) => {
  const blocks = await prisma.blockedUser.findMany();
  return blocks;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getUserById = async (request, reply) => {
  const { userId } = request.params;
  const user = await prisma.userProfile.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });
  if (!user) return reply.code(404).send({ error: "User Not Found!" });
  return user;
};

export default {
  createUserProfile,
  isUsernameAvailable,
  checkChatPermission,
  getFriendsOfUser,
  getFriendships,
  getBlocks,
  getUserById,
};
