import z from "zod";
import { authControllers } from "../controllers/auth.controllers.js";
import { prisma } from "../db/prisma.js";
import otpServices from "../services/otp.services.js";
import { getQueue, QueueType } from "../services/queue.services.js";
import { hashCompare, hashPassword } from "../utils/bcrypt.js";
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
      let { email } = request.body;
      email = email?.trim();
      const user = await prisma.user.findUnique({
        where: {
          email,
          deletedAt: null,
          isVerified: false,
        },
      });
      if (user) {
        await prisma.outBox.create({
          data: {
            eventType: "ResendVerification",
            userId: user.id,
            payload: {
              email,
            },
          },
        });
      }
      return sendSuccess(reply, 200, "Verification email sent");
    },
  );

  const otpVerifySchema = z.object({
    token: z.string().min(1, "token is required"),
  });
  fastify.post("/otp/verify", async (request, reply) => {
    const result = otpVerifySchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, errors[0]?.message || "Validation failed", {
        errors: errors,
      });
    }
    const { token } = request.body;
    const { valid, reason, userId } = await otpServices.verifyOTPByToken(
      "email_verification",
      token,
    );
    if (!valid) return sendError(reply, 400, reason);
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isVerified: true,
      },
    });
    return sendSuccess(reply, 200, "OTP verified successfully");
  });
  fastify.get("/otp/verify", async (request, reply) => {
    const result = otpVerifySchema.safeParse(request.query);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, errors[0]?.message || "Validation failed", {
        errors: errors,
      });
    }
    const { token } = request.query;
    const { valid, reason, userId } = await otpServices.verifyOTPByToken(
      "email_verification",
      token,
    );
    if (!valid) return sendError(reply, 400, reason);
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isVerified: true,
      },
    });
    await getQueue(QueueType.EMAIL).add("welcome-email", {
      email: user.email,
      template: "welcome",
      context: {
        link: environ.CLIENT_URL,
      },
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
    return sendSuccess(reply, 200, "OTP verified successfully");
  });

  // reset password using the OTP (one-time code). body: { token, password }
  const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  fastify.post("/forget-password", async (request, reply) => {
    let { email } = request.body;
    email = email?.trim();
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
          link: `${environ.CLIENT_URL}/reset-password?token=${otp.token}`,
        },
      });
    }

    return sendSuccess(reply, 200, "Verification email sent");
  });

  fastify.post("/reset-password", async (request, reply) => {
    const result = resetPasswordSchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, errors[0]?.message || "Validation failed", {
        errors: errors,
      });
    }
    const { token, password } = request.body;
    const { valid, reason, userId } = await otpServices.verifyOTPByToken(
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

    const resetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (resetUser) {
      await getQueue(QueueType.EMAIL).add("password-reset-confirmation", {
        email: resetUser.email,
        template: "passwordResetConfirmation",
        context: {},
      });
    }

    return sendSuccess(reply, 200, "PASSWORD_RESET_SUCCESS");
  });

  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must not exceed 64 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/\d/, "Must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Must contain at least one special character",
      )
      .regex(/^\S*$/, "Must not contain spaces"),
  });

  fastify.post("/change-password", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    if (!userId) {
      return sendError(reply, 401, "Unauthorized");
    }

    const result = changePasswordSchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.flatMap((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, errors[0]?.message || "Validation failed", {
        errors: errors,
      });
    }

    const { currentPassword, newPassword } = request.body;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return sendError(reply, 404, "User not found");
    }

    const isValidPassword = hashCompare(currentPassword, user.passwordHashed);
    if (!isValidPassword) {
      return sendError(reply, 401, "Current password is incorrect");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHashed: hashPassword(newPassword) },
    });

    let currentSessionId = null;
    try {
      const payload = await request.jwtVerify();
      currentSessionId = payload.jti;
    } catch (e) {}

    await prisma.session.updateMany({
      where: {
        userId: user.id,
        ...(currentSessionId && { id: { not: currentSessionId } }),
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    await getQueue(QueueType.EMAIL).add("password-change-confirmation", {
      email: user.email,
      template: "passwordResetConfirmation",
      context: {},
    });

    return sendSuccess(reply, 200, "PASSWORD_CHANGED_SUCCESS");
  });

  done();
};
