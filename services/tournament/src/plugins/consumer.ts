import amqp from "amqplib";
import fp from "fastify-plugin";
import { prisma } from "../db/prisma";

interface AmqpPluginOptions {
  url: string;
}

type MatchEndedEvent = {
  winnerId: string;
  gameMatchId: string;
  tournamentId: string;
};

const isMatchEndedEvent = (data: unknown): data is MatchEndedEvent => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.winnerId !== "string" || d.winnerId.length === 0) return false;
  if (typeof d.gameMatchId !== "string" || d.gameMatchId.length === 0)
    return false;
  if (typeof d.tournamentId !== "string" || d.tournamentId.length === 0)
    return false;
  return true;
};

export default fp<AmqpPluginOptions>(async (fastify, opts) => {
  const connection = await amqp.connect(opts.url);
  const channel = await connection.createChannel();
  const exchange = "user.events";
  const queue = "tournament.queue";
  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "tournament.*");
  await channel.bindQueue(queue, exchange, "match.*");
  await channel.bindQueue(queue, exchange, "game.*");

  fastify.decorate("rabbit", { connection, channel });

  fastify.log.info("Consumer started!");

  const handleMatchEnded = async (data: MatchEndedEvent) => {
    const { winnerId, gameMatchId, tournamentId } = data;
    console.log("Handling match ended event:", data);

    const match = await prisma.match.findFirst({
      where: { gameMatchId, tournamentId, deletedAt: null },
    });

    if (!match) {
      fastify.log.warn({ data }, "game.result match not found");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: match.id },
        data: {
          winnerId,
          status: "completed",
          playedAt: new Date(),
        },
      });

      const nextRound = match.round + 1;
      const nextSlot = Math.ceil(match.slot / 2);
      const nextMatch = await tx.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          round: nextRound,
          slot: nextSlot,
          deletedAt: null,
        },
      });

      if (nextMatch) {
        const shouldSetPlayerOne = match.slot % 2 === 1;
        const updateData: { playerOneId?: string; playerTwoId?: string } = {};

        if (shouldSetPlayerOne) {
          if (!nextMatch.playerOneId || nextMatch.playerOneId === winnerId) {
            updateData.playerOneId = winnerId;
          } else {
            fastify.log.warn(
              {
                nextMatchId: nextMatch.id,
                existingPlayerOneId: nextMatch.playerOneId,
                incomingWinnerId: winnerId,
              },
              "next match playerOneId already set",
            );
          }
        } else {
          if (!nextMatch.playerTwoId || nextMatch.playerTwoId === winnerId) {
            updateData.playerTwoId = winnerId;
          } else {
            fastify.log.warn(
              {
                nextMatchId: nextMatch.id,
                existingPlayerTwoId: nextMatch.playerTwoId,
                incomingWinnerId: winnerId,
              },
              "next match playerTwoId already set",
            );
          }
        }

        if (Object.keys(updateData).length > 0) {
          await tx.match.update({
            where: { id: nextMatch.id },
            data: updateData,
          });
        }
      } else {
        await tx.tournament.update({
          where: { id: match.tournamentId },
          data: {
            status: "completed",
            winnerId: winnerId,
          },
        });
      }
    });

    fastify.log.info({ matchId: match.id, winnerId }, "game.result processed");
  };

  fastify.addHook("onClose", async () => {
    await connection.close();
    await channel.close();
    fastify.log.info("Consumer closed!");
  });

  await channel.consume(
    queue,
    async (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          switch (msg.fields.routingKey) {
            case "game.result":
              if (!isMatchEndedEvent(data)) {
                fastify.log.warn({ data }, "game.result invalid payload");
                break;
              }
              await handleMatchEnded(data);
              break;
          }
        } catch (e) {
          fastify.log.error(e);
        }
        channel.ack(msg);
      }
    },
    { noAck: false },
  );
});
