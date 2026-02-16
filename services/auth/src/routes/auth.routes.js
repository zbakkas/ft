import z from "zod";
import { authControllers } from "../controllers/auth.controllers.js";
import { prisma } from "../db/prisma.js";
import otpServices from "../services/otp.services.js";
import { getQueue, QueueType } from "../services/queue.services.js";
import { hashPassword } from "../utils/bcrypt.js";
import { environ } from "../utils/environ.js";
import { sendError, sendSuccess } from "../utils/fastify.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify, opts, done) => {
  fastify.post("/register", authControllers.registerUser(fastify));
  fastify.post(
    "/login",
    {
      // preHandler: [fastify.rateLimit({
      //     keyGenerator: (req) => {
      //         return `auth:login:${req.ip}:${req.headers['user-agent']}`
      //     },
      // })],
    },
    authControllers.loginUser(fastify),
  );
  fastify.post("/logout", async (request, reply) => {
    const refreshToken =
      request.body?.refreshToken ||
      request.unsignCookie(request.cookies.refreshToken).value;
    const session = await prisma.session.findUnique({
      where: {
        refreshToken,
      },
    });
    if (session) {
      const now = new Date();
      if (!session.deletedAt && session.expiresAt >= now) {
        await prisma.session.update({
          where: {
            id: session.id,
          },
          data: {
            expiresAt: new Date(),
          },
        });
      }
    }
    reply.clearCookie("token", {
      path: "/",
      secure: environ.NODE_ENV === "production",
      sameSite: "none",
      domain: environ.DOMAIN,
      httpOnly: true,
    });
    reply.clearCookie("refreshToken", {
      path: "/",
      secure: environ.NODE_ENV === "production",
      sameSite: "none",
      domain: environ.DOMAIN,
      httpOnly: true,
    });
    return;
  });

  fastify.post("/refresh", authControllers.refreshToken(fastify));

  fastify.get("/sessions", authControllers.getAllUserSessions);

  fastify.delete("/sessions/:session_id", authControllers.deleteSessionById);

  fastify.get("/verify", authControllers.verifyToken);

  fastify.post(
    "/resend-verification",
    {
      preHandler: [
        // fastify.rateLimit({
        //   max: 4,
        //   timeWindow: "1h",
        //   keyGenerator: (req) => {
        //     return `auth:resend-verification:${req.ip}:${req.headers["user-agent"]}`;
        //   },
        // }),
      ],
    },
    async (request, reply) => {
      const { email } = request.body;
      const user = await prisma.user.findUnique({
        where: {
          email,
          deletedAt: null,
          isVerified: false,
        },
      });
      if (user) {
        const sessionToken = fastify.jwt.sign(
          {
            userId: user.id,
            type: "email_verification",
          },
          { expiresIn: "15m" },
        );
        await prisma.outBox.create({
          data: {
            eventType: "UserRegistered",
            userId: user.id,
            payload: {
              email,
              sessionToken,
            },
          },
        });
      }
      return sendSuccess(reply, 200, "EMAIL_VERIFICATION_SENT_IF_ASSOCIATED");
    },
  );

  const otpVerifySchema = z.object({
    otp: z.string().min(1, "OTP is required"),
    sessionToken: z.string().min(1, "sessionToken is required"),
  });
  // ? maybe i'll consider validation using tokens instead of OTPs
  fastify.post("/otp/verify", async (request, reply) => {
    const result = otpVerifySchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, "Bad request", { errors: errors });
    }
    const { sessionToken, otp } = request.body;
    let payload;
    try {
      payload = fastify.jwt.verify(sessionToken);
    } catch (err) {
      fastify.log.warn(
        { sessionToken },
        `A suspicious attempt to validate otp using invalid sessionToken`,
      );
      return sendError(reply, 401, "Invalid or expired session token");
    }
    const { userId, type } = payload;
    const { valid, reason } = await otpServices.verifyOTP(userId, type, otp);
    if (!valid) return sendError(reply, 400, reason);
    if (type === "email_verification") {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isVerified: true,
        },
      });
    }
    return sendSuccess(reply, 200, "OTP verified successfully");
  });
  fastify.get("/otp/verify", async (request, reply) => {
    const result = otpVerifySchema.safeParse(request.query);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, "Bad request", { errors: errors });
    }
    const { sessionToken, otp } = request.query;
    let payload;
    try {
      payload = fastify.jwt.verify(sessionToken);
    } catch (err) {
      fastify.log.warn(
        { reqId: request.id, sessionToken },
        `A suspicious attempt to validate otp using invalid sessionToken`,
      );
      return sendError(reply, 401, "Invalid or expired session token");
    }
    const { userId, type } = payload;
    const { valid, reason } = await otpServices.verifyOTP(userId, type, otp);
    if (!valid) return sendError(reply, 400, reason);
    if (type === "email_verification") {
      const user = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isVerified: true,
        },
      });
      console.log(payload);
      await getQueue(QueueType.EMAIL).add("welcome-email", {
        email: user.email,
        template: "welcome",
      });
      await fastify.rabbit.channel.publish(
        "user.events",
        "user.created",
        Buffer.from(
          JSON.stringify({
            userId,
          }),
        ),
        {
          persistent: true,
        },
      );
    }
    return sendSuccess(reply, 200, "OTP verified successfully");
  });

  // reset password using the OTP (one-time code). body: { userId, otp, password }
  const resetPasswordSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    token: z.string().min(1, "token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  fastify.post("/forget-password", async (request, reply) => {
    const { email } = request.body;
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
    if (user) {
      const otp = await otpServices.createOTP(
        prisma,
        user.id,
        "password_reset",
        60,
      );
      await getQueue(QueueType.EMAIL).add("password-reset", {
        email: user.email,
        template: "passwordReset",
        context: {
          link: `${environ.CLIENT_URL}/reset-password?userId=${user.id}&otp=${otp.token}`,
        },
      });
    }

    return sendSuccess(reply, 200, "PASSWORD_RESET_SENT_IF_ASSOCIATED");
  });

  fastify.post("/reset-password", async (request, reply) => {
    const result = resetPasswordSchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, "Bad request", { errors: errors });
    }
    const { userId, token, password } = request.body;
    const { valid, reason } = await otpServices.verifyOTP(
      userId,
      "password_reset",
      token,
    );
    if (!valid) return sendError(reply, 400, reason);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHashed: hashPassword(password) },
    });
    await prisma.session.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await getQueue(QueueType.EMAIL).add("password-reset-confirmation", {
      email: (await prisma.user.findUnique({ where: { id: userId } })).email,
      template: "passwordResetConfirmation",
      context: {},
    });

    return sendSuccess(reply, 200, "PASSWORD_RESET_SUCCESS");
  });

  done();
};
