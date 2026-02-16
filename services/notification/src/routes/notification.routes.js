import notificationControllers from "../controllers/notification.controllers.js";
import { isUserBlocked } from "../utils/cache.js";
import { redis } from "../utils/redis.js";

/**
 * @type {Map<string, Set<import('@fastify/websocket').WebSocket>>}
 */
export const users = new Map();

export const broadcastToUser = (userId, data) => {
  const user = users.get(userId);
  if (!user) return;
  for (const socket of user) {
    socket.send(JSON.stringify(data));
  }
};

const notifyFriendsOfPresence = async (userId, status) => {
  const friends = await redis.smembers(`notification:friends:${userId}`);
  for (const friendId of friends) {
    if (!users.has(friendId)) continue;
    if (
      (await isUserBlocked(userId, friendId)) ||
      (await isUserBlocked(friendId, userId))
    )
      continue;
    for (const socket of users.get(friendId)) {
      socket.send(
        JSON.stringify({
          type: "presence",
          payload: {
            userId,
            status,
          },
        }),
      );
    }
  }
};

const notifyUserOfPresence = async (socket) => {
  const friends = await redis.smembers(`notification:friends:${socket.userId}`);
  const onlineFriends = friends.filter(
    (id) => users.has(id) && users.get(id).size > 0,
  );
  const nonBlocking = await Promise.all(
    onlineFriends.map(async (id) => ({
      id,
      blocked:
        (await isUserBlocked(socket.userId, id)) ||
        (await isUserBlocked(id, socket.userId)),
    })),
  );
  socket.send(
    JSON.stringify({
      type: "friends:online",
      payload: {
        onlineFriends: nonBlocking.filter((f) => !f.blocked).map((f) => f.id),
      },
    }),
  );
};

export const notifyPresenceChange = async (
  { requesterId: blockerId, receiverId: blockedId },
  status = "offline",
) => {
  if (users.has(blockedId) && users.has(blockerId)) {
    const blocked = users.get(blockedId);
    for (const socket of blocked) {
      socket.send(
        JSON.stringify({
          type: "presence",
          payload: {
            userId: blockerId,
            status,
          },
        }),
      );
    }
    const blocker = users.get(blockerId);
    for (const socket of blocker) {
      socket.send(
        JSON.stringify({
          type: "presence",
          tada: "...",
          payload: {
            userId: blockedId,
            status,
          },
        }),
      );
    }
  }
};

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify) => {
  fastify.get("/live", { websocket: true }, (socket, req) => {
    const { userId } = req.query;
    socket.userId = userId;
    console.log(`${userId} connected!`);
    notifyUserOfPresence(socket);
    if (!users.has(userId)) {
      users.set(userId, new Set());
      notifyFriendsOfPresence(userId, "online");
    }
    users.get(userId).add(socket);
    socket.on("message", (message) => {
      socket.send(`Message from ${userId}: ${message}`);
    });
    // const intervalId = setInterval(() => {
    //   socket.send(
    //     JSON.stringify({
    //       type: "ping",
    //       message: `${Math.floor(Date.now() / 1000)}`,
    //     })
    //   );
    // }, 3000);
    socket.on("close", () => {
      const userSocket = users.get(userId);
      if (userSocket) {
        userSocket.delete(socket);
        if (userSocket.size === 0) {
          users.delete(userId);
          notifyFriendsOfPresence(userId, "offline");
        }
      }
      // clearInterval(intervalId);
      console.log(`${userId} closed connection`);
    });
  });
  fastify.get("/notifications", notificationControllers.getUserNotifications);
  fastify.patch(
    "/notifications/:notificationId/read",
    notificationControllers.markNotificationAsRead,
  );
  fastify.post(
    "/notifications/read_all",
    notificationControllers.readAllNotifications,
  );
};

// setInterval(() => {
//   let count = 0;
//   let totalClients = 0;
//   for (const conn of users) {
//     totalClients++;
//     count += conn[1].size;
//   }
//   console.log(`Active clients: ${totalClients}`);
//   console.log(`Active connections: ${count}`);
// }, 1000);
