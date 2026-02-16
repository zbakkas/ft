import { prisma } from "../db/prisma.js";
import { randomUUID } from "crypto";
import { v7 as uuid } from "uuid";

const isUserExists = async (email) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  return user;
};

const newUserSession = async (fastify, request, userId) => {
  const refreshToken = uuid();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"],
      expiresAt,
    },
  });
  const accessToken = fastify.jwt.sign(
    { userId, jti: session.id },
    { expiresIn: "2h" }
  );
  return { accessToken, refreshToken };
};

export const authService = {
  newUserSession,
  isUserExists,
};
