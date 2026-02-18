import { prisma } from "../db/prisma.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../schemas/auth.schemas.js";
import { authService } from "../services/auth.services.js";
import { hashCompare, hashPassword } from "../utils/bcrypt.js";
import { environ } from "../utils/environ.js";
import { requestToHeaders, sendError, sendSuccess } from "../utils/fastify.js";
import { postInternal } from "../utils/internalClient.js";

/**
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @return {import('fastify').RouteHandlerMethod}
 */
const registerUser = (fastify) => async (request, reply) => {
  const result = registerUserSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.errors.flatMap((err) => ({
      path: err.path?.join(".") || err.keys?.join("."),
      message: err.message,
    }));
    return sendError(reply, 400, errors[0]?.message || "Validation failed", { errors: errors });
  }
  let { email, password, username } = request.body;
  email = email?.trim();
  username = username?.trim();
  const [userExists, usernameAvailable] = await Promise.all([
    authService.isUserExists(email),
    postInternal(
      `${environ.USER_MGMT_SERVICE_URL}/internal/username-available`,
      { username },
      requestToHeaders(request),
    ),
  ]);

  if (userExists) {
    return sendError(reply, 409, "User already exists!");
  }

  if (!usernameAvailable.ok) {
    return sendError(reply, 409, "Username already taken!");
  }

  await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        passwordHashed: hashPassword(password),
      },
      select: {
        id: true,
      },
    });
    await tx.outBox.create({
      data: {
        eventType: "UserRegistered",
        userId: createdUser.id,
        payload: {
          username,
          email,
          headers: requestToHeaders(request),
        },
      },
    });
  });
  return sendSuccess(
    reply,
    201,
    "Registration successful. Verification email will be sent shortly.",
  );
};

/**
 *
 * @param {import('fastify').FastifyInstance} fastify
 * @return {import('fastify').RouteHandlerMethod}
 */
const loginUser = (fastify) => async (request, reply) => {
  const result = loginUserSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.errors.flatMap((err) => ({
      path: err.path?.join(".") || err.keys?.join("."),
      message: err.message,
    }));
    return sendError(reply, 400, errors[0]?.message || "Validation failed", { errors: errors });
  }
  let { email, password } = request.body;
  email = email?.trim();
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
    include: {
      TwoFactorAuth: {
        where: {
          isEnabled: true,
        },
      },
    },
  });
  if (!user) return sendError(reply, 401, "Email or Password incorrect!");
  if (!hashCompare(password, user.passwordHashed))
    return sendError(reply, 401, "Email or Password incorrect!");
  if (!user.isVerified)
    return sendError(
      reply,
      401,
      "You must verify your account, check your inbox!",
      { status: "email_validation_required" },
    );
  if (user.TwoFactorAuth.length > 0) {
    const sessionToken = fastify.jwt.sign(
      { userId: user.id, stat: "awaiting_2fa" },
      { expiresIn: "4m" },
    );
    return sendError(reply, 401, "Please enter your 2FA code.", {
      status: "2fa_required",
      sessionToken,
    });
  }
  const { accessToken, refreshToken } = await authService.newUserSession(
    fastify,
    request,
    user.id,
  );
  reply.setCookie("token", accessToken, {
    path: "/",
    secure: environ.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 60 * 60 * 2,
    signed: true,
    domain: environ.DOMAIN,
    httpOnly: true,
  });
  console.log(environ.NODE_ENV);
  reply.setCookie("refreshToken", refreshToken, {
    path: "/",
    secure: environ.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 60 * 60 * 24 * 7,
    signed: true,
    domain: environ.DOMAIN,
    httpOnly: true,
  });
  return;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const refreshToken = (fastify) => async (request, reply) => {
  const refreshToken = () => {
    if (request.body?.refreshToken) {
      return request.body?.refreshToken;
    }
    if (request.cookies.refreshToken) {
      return request.unsignCookie(request.cookies.refreshToken).value;
    }
    return "";
  };
  const session = await prisma.session.findUnique({
    where: {
      refreshToken: refreshToken(),
    },
  });
  if (!session) return sendError(reply, 401, "Invalid refresh token");
  const now = new Date();
  if (session.deletedAt || session.expiresAt < now)
    return sendError(reply, 401, "Refresh token expired");
  const userAgent = request.headers["user-agent"];
  if (userAgent !== session.userAgent)
    return sendError(reply, 401, "Invalid session");
  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  const userSession = await authService.newUserSession(
    fastify,
    request,
    session.userId,
  );
  reply.setCookie("token", userSession.accessToken, {
    path: "/",
    secure: environ.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 60 * 60 * 2,
    signed: true,
    domain: environ.DOMAIN,
    httpOnly: true,
  });
  reply.setCookie("refreshToken", userSession.refreshToken, {
    path: "/",
    secure: environ.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 60 * 60 * 24 * 7,
    signed: true,
    domain: environ.DOMAIN,
    httpOnly: true,
  });
  return;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getAllUserSessions = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  return prisma.session.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  });
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const deleteSessionById = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const { session_id } = request.params;
  const session = await prisma.session.findUnique({
    where: {
      id: session_id,
      userId,
      deletedAt: null,
    },
  });
  if (!session) return sendError(reply, 404, "Session not found!");
  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  return sendSuccess(reply, 200, "Session deleted successfully!");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const verifyToken = async (request, reply) => {
  try {
    const payload = await request.jwtVerify();
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        status: "active",
        deletedAt: null,
      },
      include: {
        Session: {
          where: {
            id: payload.jti,
            deletedAt: null,
          },
        },
      },
    });
    if (!user || !user.Session.length)
      return reply.code(401).send({ error: "Unauthorized" });
    reply.code(200).send({ userId: user.id });
  } catch (e) {
    reply.code(401).send({ error: "Unauthorized" });
  }
};

export const authControllers = {
  registerUser,
  loginUser,
  refreshToken,
  getAllUserSessions,
  deleteSessionById,
  verifyToken,
};
