import { prisma } from "../db/prisma.js";
import { randomUUID } from "crypto";
import { postInternal } from "../utils/internalClient.js";
import { environ } from "../utils/environ.js";

/**
 * @type {Map<string, Set<import('@fastify/websocket').WebSocket>>}
 */
const connections = new Map();

/**
 * @type {Map<string, Set<import('@fastify/websocket').WebSocket>>}
 */
const conversations = new Map();

const broadcastToConversation = (connId, conversationId, data) => {
  if (!conversations.has(conversationId)) return;
  for (const conn of conversations.get(conversationId)) {
    if (conn.connId === connId) continue;
    conn.send(JSON.stringify(data));
  }
};

const sendMessage = async (conn, targetUserId, payload) => {
  let conversation = await prisma.conversation.findFirst({
    where: {
      deletedAt: null,
      AND: [
        { members: { every: { userId: { in: [conn.userId, targetUserId] } } } },
        { members: { some: { userId: conn.userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
  });
  console.log(conversation);
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        members: {
          createMany: {
            data: [{ userId: conn.userId }, { userId: targetUserId }],
          },
        },
      },
    });
    console.log(conversation);
  }
  const res = await postInternal(
    `${environ.USER_MGMT_SERVICE_URL}/internal/chat/permissions/${conn.userId}/${targetUserId}`
  );
  if (!res.ok) return conn.send(JSON.stringify({ error: "Unauthorized" }));
  const message = await prisma.message.create({
    data: {
      id: payload.msgId,
      conversationId: conversation.id,
      content: payload.content,
      senderId: conn.userId,
    },
  });
  const targetUserInConversation = (userId, targetUserId) => {
    const key = `conversation:${min(userId, targetUserId)}:${max(
      userId,
      targetUserId
    )}`;
    if (!conversations.has(key)) return false;
    for (const c of conversations.get(key)) {
      if (c.userId === targetUserId) return true;
    }
    return false;
  };
  if (
    !connections.has(targetUserId) ||
    !targetUserInConversation(conn.userId, targetUserId)
  ) {
    console.error("doesn't has conv!!");
    await conn.rabbit.channel.publish(
      "user.events",
      "message.new",
      Buffer.from(
        JSON.stringify({
          userId: targetUserId,
          fromUser: conn.userId,
        })
      ),
      {
        persistent: true,
      }
    );
  }
  const key = `conversation:${min(conn.userId, targetUserId)}:${max(
    conn.userId,
    targetUserId
  )}`;
  payload.createdAt = message.createdAt;
  broadcastToConversation(conn.connId, key, {
    type: "message:new",
    senderId: conn.userId,
    payload,
  });
};

const { min, max } = {
  min: (s1, s2) => {
    if (s1 < s2) return s1;
    return s2;
  },
  max: (s1, s2) => {
    if (s1 > s2) return s1;
    return s2;
  },
};

const conversationSub = (conn, targetUserId) => {
  const key = `conversation:${min(conn.userId, targetUserId)}:${max(
    conn.userId,
    targetUserId
  )}`;
  if (!conversations.has(key)) conversations.set(key, new Set());
  conversations.get(key).add(conn);
  conn.send(
    JSON.stringify({
      success: true,
    })
  );
};

const conversationUnSub = (conn, targetUserId) => {
  const key = `conversation:${min(conn.userId, targetUserId)}:${max(
    conn.userId,
    targetUserId
  )}`;
  if (!conversations.has(key)) return;
  conversations.get(key).delete(conn);
  if (conversations.get(key).size === 0) {
    conversations.delete(key);
  }
  conn.send(
    JSON.stringify({
      success: true,
    })
  );
};

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default async (fastify) => {
  fastify.get("/live", { websocket: true }, async (socket, req) => {
    const internals = [];
    const { userId } = req.query;
    if (!userId) {
      socket.close();
      return;
    }
    socket.userId = userId;
    socket.connId = randomUUID();
    socket.rabbit = fastify.rabbit;
    socket.typing = false;

    if (!connections.has(userId)) connections.set(userId, new Set());

    connections.get(userId).add(socket);
    internals.push(
      setInterval(() => {
        socket.send(
          JSON.stringify({
            type: "ping",
            message: `${Math.floor(Date.now() / 1000)}`,
          })
        );
      }, 3000)
    );

    socket.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch {
        socket.send(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      switch (data.type) {
        case "message:send":
          await sendMessage(socket, data.targetUserId, data.payload);
          break;
        case "message:delete":
          const msg = await prisma.message.findUnique({
            where: { id: data.msgId },
            include: {
              conversation: {
                include: { members: { where: { NOT: { userId } } } },
              },
            },
          });
          if (!msg) {
            socket.send(JSON.stringify({ success: false }));
            break;
          }
          await prisma.message.delete({
            where: {
              id: data.msgId,
            },
          });
          const targetUserId = msg.conversation.members[0].userId;
          const key = `conversation:${min(socket.userId, targetUserId)}:${max(
            socket.userId,
            targetUserId
          )}`;
          broadcastToConversation(socket.connId, key, {
            type: "message:deleted",
            senderId: socket.userId,
            payload: {
              msgId: msg.id,
            },
          });
          socket.send(JSON.stringify({ msgId: msg.id, success: true }));
          break;
        case "message:typing":
          ((socket, targetUserId, typing) => {
            const key = `conversation:${min(conn.userId, targetUserId)}:${max(
              conn.userId,
              targetUserId
            )}`;
          })(socket, data.targetUserId, data.typing);
          break;
        case "ping":
          socket.send(JSON.stringify({ type: "pong" }));
          break;
        case "subscribe:conversation":
          conversationSub(socket, data.targetUserId);
          break;
        case "unsubscribe:conversation":
          conversationUnSub(socket, data.targetUserId);
          break;
        default:
          socket.send(JSON.stringify({ error: "Unknown message type" }));
      }
    });
    socket.on("close", async () => {
      const userCon = connections.get(userId);
      if (userCon) {
        userCon.delete(socket);
        if (userCon.size === 0) {
          connections.delete(userId);
        }
      }
      for (const interval of internals) {
        clearInterval(interval);
      }
      console.log("Client disconnected");
    });
  });
};
