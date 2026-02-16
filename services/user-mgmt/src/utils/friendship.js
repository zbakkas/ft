import { prisma } from "../db/prisma.js";

const isFriendShipExists = async (userId, targetUserId) => {
  return !!(await prisma.friendship.findFirst({
    where: {
      OR: [
        {
          requesterId: userId,
          receiverId: targetUserId,
        },
        {
          receiverId: userId,
          requesterId: targetUserId,
        },
      ],
    },
  }));
};

const findFriendShip = async (userId, targetUserId) => {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        {
          requesterId: userId,
          receiverId: targetUserId,
        },
        {
          receiverId: userId,
          requesterId: targetUserId,
        },
      ],
    },
  });
};

const isBlocked = async (userId, targetUserId) => {
  return !!(await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: userId },
      ],
    },
  }));
};

export { isFriendShipExists, findFriendShip, isBlocked };
