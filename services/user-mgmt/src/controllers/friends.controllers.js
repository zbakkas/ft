import { prisma } from "../db/prisma.js";
import "../schemas/successMessages.js";
import { sendError, sendSuccess } from "../utils/fastify.js";
import {
  isBlocked,
  isFriendShipExists
} from "../utils/friendship.js";

const friendsFilter = (userId) => ({
  sent: {
    status: "pending",
    requesterId: userId,
  },
  received: {
    status: "pending",
    receiverId: userId,
  },
  accepted: {
    status: "accepted",
    OR: [
      {
        requesterId: userId,
      },
      {
        receiverId: userId,
      },
    ],
  },
});

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */

const getFriends = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const status = request.query.status || "accepted";
  const friends = await prisma.friendship.findMany({
    where: {
      ...friendsFilter(userId)[status],
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
      id: true,
      status: true,
      requester: {
        select: {
          id: true,
          username: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
        },
      },
      createdAt: true,
    },
  });
  return friends.map((friendship) => ({
    id: friendship.id,
    userId:
      friendship.requester.id === userId
        ? friendship.receiver.id
        : friendship.requester.id,
    username:
      friendship.requester.id === userId
        ? friendship.receiver.username
        : friendship.requester.username,
    createdAt: friendship.createdAt,
  }));
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const addFriend = (fastify) => async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const { targetUserId } = request.params;

  if (userId === targetUserId)
    return sendError(reply, 400, "USER_CANNOT_ACT_ON_SELF");

  // ! replace it
  if (!(await prisma.userProfile.findUnique({ where: { id: targetUserId } }))) {
    return sendError(reply, 404, "USER_NOT_FOUND");
  }

  if (await isBlocked(userId, targetUserId)) {
    return sendError(reply, 404, "USER_NOT_FOUND");
  }

  if (await isFriendShipExists(userId, targetUserId)) {
    return sendError(reply, 400, "FRIEND_REQUEST_SENT_OR_ALREADY_FRIENDS");
  }
  await prisma.friendship.create({
    data: {
      requesterId: userId,
      receiverId: targetUserId,
    },
  });
  await fastify.rabbit.channel.publish(
    "user.events",
    "friendship.request",
    Buffer.from(
      JSON.stringify({
        type: "friend:request",
        userId: targetUserId,
        fromUser: userId,
      })
    ),
    {
      persistent: true,
    }
  );
  return sendSuccess(reply, 200, "FRD_REQ_SENT_SUCCESS");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const updateFriendRequest = (fastify) => async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const { targetUserId, action } = request.params;

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { receiverId: userId, requesterId: targetUserId },
        { receiverId: targetUserId, requesterId: userId },
      ],
    },
  });
  if (!friendship) return sendError(reply, 400, "NO_SUCH_FRIENDSHIP_ID");
  if (action === "accept") {
    if (friendship.status !== "pending")
      return sendError(reply, 400, "CANNOT_ACCEPT_FRIENDSHIP");
    await prisma.friendship.update({
      where: {
        id: friendship.id,
      },
      data: {
        status: "accepted",
      },
    });
    await fastify.rabbit.channel.publish(
      "user.events",
      "friendship.created",
      Buffer.from(
        JSON.stringify({
          type: "friend:accepted",
          userId: targetUserId,
          fromUser: userId,
        })
      ),
      {
        persistent: true,
      }
    );
    return sendSuccess(reply, 200, "FRD_REQ_ACCEPTED_SUCCESS");
  } else if (action === "remove") {
    if (friendship.status !== "accepted")
      return sendError(reply, 400, "CANNOT_REMOVE_FRIENDSHIP");
    await prisma.friendship.delete({
      where: { id: friendship.id },
    });
    await fastify.rabbit.channel.publish(
      "user.events",
      "friendship.removed",
      Buffer.from(
        JSON.stringify({
          requesterId: friendship.requesterId,
          receiverId: friendship.receiverId,
        })
      ),
      {
        persistent: true,
      }
    );
    return sendSuccess(reply, 200, "FRD_REMOVED_SUCCESS");
  } else if (action === "cancel") {
    if (friendship.requesterId !== userId)
      return sendError(reply, 404, "NO_SUCH_FRIENDSHIP_ID");
    await prisma.friendship.delete({
      where: { id: friendship.id },
    });
    return sendSuccess(reply, 200, "FRD_REQ_CANCELED_SUCCESS");
  } else if (action === "decline") {
    if (friendship.receiverId !== userId)
      return sendError(reply, 404, "NO_SUCH_FRIENDSHIP_ID");
    await prisma.friendship.delete({
      where: { id: friendship.id },
    });
    return sendSuccess(reply, 200, "FRD_REQ_DECLINED_SUCCESS");
  }

  return sendError(reply, 400, "UNSUPPORTED_ACTION");
};

export default {
  getFriends,
  addFriend,
  updateFriendRequest,
};
