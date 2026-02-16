import { prisma } from "../db/prisma.js";

/**
 * @type {import('fastify').FastifyPluginAsync}
 */
export default async (fastify, opts) => {
  fastify.get("/conversations", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    return prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
        deletedAt: null,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          where: {
            deletedAt: null,
          },
          take: 1,
          select: {
            content: true,
            senderId: true,
          },
        },
      },
    });
  });

  fastify.get("/conversations/:targetUserId", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { targetUserId } = request.params;
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            members: { every: { userId: { in: [userId, targetUserId] } } },
          },
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
        deletedAt: null,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });
    if (!conversation) return reply.status(404).send();
    return conversation;
  });

  fastify.get("/dm/:targetUserId", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { targetUserId } = request.params;
    const { page = 1, limit = 10 } = request.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const where = {
      deletedAt: null,
      conversation: {
        AND: [
          {
            members: { every: { userId: { in: [userId, targetUserId] } } },
          },
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
        deletedAt: null,
      },
    };
    const total = await prisma.message.count({
      where,
    });
    const messages = await prisma.message.findMany({
      where,
      omit: {
        conversationId: true,
        fileUrl: true,
        deletedAt: true,
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: {
        createdAt: "desc",
      },
    });
    return {
      total,
      totalPages: Math.ceil(total / limitNum),
      page: pageNum,
      limit: limitNum,
      messages,
    };
  });

  fastify.post("/conversations/:id", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { id } = request.params;
    const { content } = request.body;
    const conversation = await prisma.conversation.findUnique({
      where: {
        id,
        members: {
          some: { userId },
        },
        deletedAt: null,
      },
    });
    if (!conversation) return reply.status(404).send();
    return prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId: conversation.id,
      },
    });
  });

  fastify.delete("/message/:id", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { id } = request.params;
    const message = await prisma.message.findUnique({
      where: {
        id,
        senderId: userId,
        deletedAt: null,
      },
    });
    if (!message) return reply.status(404).send({ error: "Not found" });
    await prisma.message.update({
      where: { id: message.id },
      data: { deletedAt: new Date() },
    });
    return;
  });

  const exchange = "user.events";

  fastify.post("/conversations", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { targetUserId, content } = request.body;
    if (userId === targetUserId)
      return reply.status(400).send({ error: "error" });
    const chat = await prisma.conversation.findFirst({
      where: {
        deletedAt: null,
        AND: [
          { members: { every: { userId: { in: [userId, targetUserId] } } } },
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (!chat) {
      return await prisma.conversation.create({
        data: {
          members: {
            createMany: {
              data: [
                {
                  userId,
                },
                {
                  userId: targetUserId,
                },
              ],
            },
          },
          messages: {
            create: {
              content,
              senderId: userId,
            },
          },
        },
        include: {
          members: true,
        },
      });
    }

    await fastify.rabbit.channel.publish(
      exchange,
      "message.new",
      Buffer.from(
        JSON.stringify({
          content,
          senderId: userId,
          targetUserId,
        })
      ),
      {
        persistent: true,
      }
    );

    return prisma.message.create({
      data: {
        content,
        senderId: userId,
        conversationId: chat.id,
      },
    });
  });
};
