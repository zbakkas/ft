import { prisma } from "../db/prisma.js";

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getUserNotifications = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  console.log(userId);
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return notifications;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const markNotificationAsRead = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const notificationId = request.params.notificationId;
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
      userId,
      deletedAt: null,
    },
  });
  // ! Change error message
  if (!notification) {
    reply.status(404);
    return reply.send({ error: "Not found!" });
  }
  if (notification.readAt)
    return reply.send({ error: "Already read this notification!" });
  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: {
      readAt: new Date(),
    },
  });
  return updated;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const readAllNotifications = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const notification = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      deletedAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
  return { success: true, ...notification };
};

export default {
  getUserNotifications,
  markNotificationAsRead,
  readAllNotifications,
};
