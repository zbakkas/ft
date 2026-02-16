import { randomUUIDv7 } from "bun";
import type { FastifyPluginCallback } from "fastify";
import z from "zod";
import { prisma } from "../db/prisma";
import { environ } from "../utils/environ";

const shuffle = (arr: any[]) => {
  for (let i = 0; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const TournamentBodySchema = z
  .object({
    name: z.string(),
    numberOfParticipants: z.number().int().positive(),
  })
  .superRefine((data, ctx) => {
    const numberOfParticipants = data.numberOfParticipants;
    if (
      numberOfParticipants & (numberOfParticipants - 1) ||
      numberOfParticipants === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "numberOfParticipants must be a power of two",
        path: ["numberOfParticipants"],
      });
    }
    if (numberOfParticipants < 2 || numberOfParticipants > 64) {
      ctx.addIssue({
        code: "custom",
        message: "numberOfParticipants must be between 2 and 64",
        path: ["numberOfParticipants"],
      });
    }
  });

export default ((fastify, opts) => {
  fastify.get("/tournaments", async (request, reply) => {
    const tournaments = await prisma.tournament.findMany({
      where: { deletedAt: null },
      include: {
        participants: {
          where: { deletedAt: null },
          omit: {
            deletedAt: true,
            tournamentId: true,
          },
        },
        matches: true,
      },
      omit: {
        deletedAt: true,
      },
    });
    return tournaments;
  });
  fastify.delete("/tournaments", async (request, reply) => {
    const tournaments = await prisma.tournament.deleteMany();
    return tournaments;
  });
  fastify.delete("/tournaments/:tournamentId", async (request, reply) => {
    const userId = request.headers["x-user-id"] as string;
    const { tournamentId } = request.params as { tournamentId: string };
    const deletedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
    });
    if (!deletedTournament) {
      reply.status(404);
      return { success: false, error: "Tournament not found" };
    }
    if (deletedTournament.createdBy !== userId) {
      reply.status(403);
      return {
        success: false,
        error: "Only the tournament creator can delete the tournament",
      };
    }
    if (deletedTournament.status !== "upcoming") {
      reply.status(400);
      return {
        success: false,
        error: "Cannot delete a tournament that has started or completed",
      };
    }
    await prisma.$transaction(async (tx) => {
      await tx.tournament.updateMany({
        where: { id: tournamentId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.participant.updateMany({
        where: { tournamentId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.match.updateMany({
        where: { tournamentId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });
    return { success: true, message: "Tournament deleted successfully" };
  });
  fastify.get("/test", async (request, reply) => {
    return fetch(`${environ.GAME_SERVICE_URL!}/api/tournament/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_one_ID: randomUUIDv7(),
        player_two_ID: randomUUIDv7(),
        roomId: randomUUIDv7(),
        tournamentId: randomUUIDv7(),
      }),
    });
  });
  fastify.post("/new_tournament", async (request, reply) => {
    const parseResult = TournamentBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.status(400);
      return { errors: parseResult.error };
    }
    const { name, numberOfParticipants } = parseResult.data;
    const userId = request.headers["x-user-id"] as string | undefined;
    if (!userId) {
      reply.status(401);
      return;
    }

    const newTournament = await prisma.$transaction(async (tx) => {
      const newTournament = await tx.tournament.create({
        data: {
          createdBy: userId,
          name,
          numberOfParticipants,
        },
        omit: {
          deletedAt: true,
        },
      });
      await tx.participant.create({
        data: {
          userId,
          tournamentId: newTournament.id,
        },
      });
      return newTournament;
    });
    return newTournament;
  });

  fastify.post("/join_tournament/:tournamentId", async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const userId = request.headers["x-user-id"] as string | undefined;
    if (!userId) {
      reply.status(401);
      return;
    }
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
      include: { participants: { where: { deletedAt: null } } },
    });
    if (!tournament) {
      reply.status(404);
      return { error: "Tournament not found" };
    }
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        userId,
        tournamentId,
        deletedAt: null,
      },
    });
    if (existingParticipant) {
      reply.status(400);
      return { error: "User already joined the tournament" };
    }
    if (tournament.participants.length >= tournament.numberOfParticipants) {
      reply.status(400);
      return { error: "Tournament is full" };
    }
    const newParticipant = await prisma.participant.create({
      data: {
        userId,
        tournamentId,
      },
    });
    return newParticipant;
  });

  fastify.post("/leave_tournament/:tournamentId", async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const userId = request.headers["x-user-id"] as string | undefined;
    if (!userId) {
      reply.status(401);
      return;
    }
    const participant = await prisma.participant.findFirst({
      where: {
        userId,
        tournamentId,
        deletedAt: null,
        tournament: { deletedAt: null },
      },
      include: { tournament: true },
    });
    if (!participant) {
      reply.status(404);
      return { error: "Participant not found in the tournament" };
    }
    if (participant.tournament.createdBy === userId) {
      reply.status(400);
      return { error: "Tournament creator cannot leave the tournament" };
    }
    if (participant.tournament.status !== "upcoming") {
      reply.status(400);
      return {
        error: "Cannot leave a tournament that has started or completed",
      };
    }
    await prisma.participant.updateMany({
      where: {
        id: participant.id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return { message: "Successfully left the tournament" };
  });

  fastify.post("/start_tournament/:tournamentId", async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const userId = request.headers["x-user-id"] as string | undefined;
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
      include: { participants: { where: { deletedAt: null } } },
    });
    if (!tournament) {
      reply.status(404);
      return { error: "Tournament not found" };
    }
    if (tournament.createdBy !== userId) {
      reply.status(403);
      return { error: "Only the tournament creator can start the tournament" };
    }
    if (tournament.status !== "upcoming") {
      reply.status(400);
      return { error: "Tournament has already started or completed" };
    }
    if (tournament.participants.length !== tournament.numberOfParticipants) {
      reply.status(400);
      return { error: "Not enough participants to start the tournament" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "ongoing" },
      });

      const rounds = Math.log2(tournament.numberOfParticipants);
      for (let round = 1; round <= rounds; round++) {
        const matchesInRound =
          tournament.numberOfParticipants / Math.pow(2, round);
        for (let slot = 1; slot <= matchesInRound; slot++) {
          await tx.match.create({
            data: {
              tournamentId,
              round,
              slot,
              status: "scheduled",
            },
          });
        }
      }
      shuffle(tournament.participants);
      for (let i = 0; i < tournament.participants.length; i += 2) {
        const participant1 = tournament.participants[i] as any;
        const participant2 = tournament.participants[i + 1] as any;
        const match = await tx.match.findFirst({
          where: {
            tournamentId,
            round: 1,
            slot: i / 2 + 1,
          },
        });
        if (match) {
          await tx.match.update({
            where: { id: match.id },
            data: {
              playerOneId: participant1.userId,
              playerTwoId: participant2.userId,
            },
          });
        }
      }
    });
  });
  fastify.post("/matches/:matchId/start", async (request, reply) => {
    const { matchId } = request.params as { matchId: string };
    const userId = request.headers["x-user-id"] as string | undefined;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      reply.status(404);
      return { success: false, error: "Match not found" };
    }

    if (match.playerOneId !== userId && match.playerTwoId !== userId) {
      reply.status(403);
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    if (match.gameMatchId) {
      return {
        success: true,
        gameMatchId: match.gameMatchId,
      };
    }

    const gameMatchId = await prisma.$transaction(async (tx) => {
      const newGameMatchId = randomUUIDv7();

      await tx.match.update({
        where: { id: matchId },
        data: {
          gameMatchId: newGameMatchId,
          status: "running",
        },
      });

      const res = await fetch(
        `${environ.GAME_SERVICE_URL!}/api/tournament/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_one_ID: match.playerOneId,
            player_two_ID: match.playerTwoId,
            roomId: newGameMatchId,
            tournamentId: match.tournamentId,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to create game match");
      }

      return newGameMatchId;
    });

    const opponentId =
      match.playerOneId === userId ? match.playerTwoId : match.playerOneId;
    try {
      fastify.rabbit.channel.publish(
        "user.events",
        "tournament.match-started",
        Buffer.from(
          JSON.stringify({
            userId: opponentId,
            fromUser: userId,
            matchId: matchId,
            gameMatchId: gameMatchId,
            tournamentId: match.tournamentId,
          }),
        ),
        { persistent: true },
      );
    } catch (error) {
      fastify.log.error(
        { error },
        "Failed to publish match start notification",
      );
    }

    return {
      success: true,
      gameMatchId,
    };
  });

  fastify.get("/tournaments/:tournamentId/bracket", async (request, reply) => {
    const { tournamentId } = request.params as { tournamentId: string };
    const tournament = await prisma.tournament.findFirst({
      where: { id: tournamentId, deletedAt: null },
      include: {
        matches: {
          where: { deletedAt: null },
          orderBy: [{ round: "asc" }, { slot: "asc" }],
        },
        participants: {
          where: { deletedAt: null },
        },
      },
    });
    if (!tournament) {
      reply.status(404);
      return { error: "Tournament not found" };
    }
    if (tournament.matches && tournament.matches.length === 1) {
      (tournament.matches[0] as any).left = null;
      (tournament.matches[0] as any).right = null;
      return tournament.matches[0];
    }
    const totalRounds = Math.log2(tournament.numberOfParticipants);
    let tree = {};
    for (let round = 1; round < totalRounds; round++) {
      const roundMatches = tournament.matches.filter((m) => m.round === round);
      for (let j = 0; j < roundMatches.length; j += 2) {
        const match1 = roundMatches[j] as any;
        const match2 = roundMatches[j + 1] as any;
        const parentMatch = tournament.matches.find(
          (m) => m.round === round + 1 && m.slot === Math.ceil(match1.slot / 2),
        ) as any;
        parentMatch.left = match1;
        parentMatch.right = match2;
        tree = parentMatch;
      }
    }
    return tree;
  });
}) as FastifyPluginCallback;
