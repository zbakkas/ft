import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { _2FAService } from "../services/twoFactor.services.js";
import { prisma } from "../db/prisma.js";
import { setup2FASchema } from "../schemas/twoFactor.schemas.js";
import { sendError, sendSuccess } from "../utils/fastify.js";
import { authService } from "../services/auth.services.js";
import { environ } from "../utils/environ.js";

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify, opts, done) => {
  fastify.post("/setup", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const result = setup2FASchema.safeParse(request.body);
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        path: err.path?.join(".") || err.keys?.join("."),
        message: err.message,
      }));
      return sendError(reply, 400, "Bad request", { errors: errors });
    }
    const { method } = request.body;
    if (await _2FAService.userHas2FA(userId, method))
      return sendError(reply, 400, `You've already setup ${method}`);
    const twoFa = await _2FAService.setup2FA(userId);
    await _2FAService.store2FA(userId, twoFa);
    return sendSuccess(reply, 201, ``, { ...twoFa });
  });
  // TODO: validate body
  fastify.post("/verify", async (request, reply) => {
    const userId = request.headers["x-user-id"];
    const { code, method } = request.body;
    const user2FA = await _2FAService.fetchUser2FA(userId, method);
    if (!user2FA)
      return sendError(reply, 400, `You must setup ${method} first`);
    else if (user2FA.isVerified) {
      return sendError(reply, 400, `You've already verified ${method}`);
    }
    const secret = _2FAService.decrypt2FASecret(
      user2FA.secret,
      user2FA.iv,
      user2FA.tag
    );
    if (await _2FAService.verify2FAToken(secret, code)) {
      const backupCodes = _2FAService.generateBackupCodes();
      await prisma.twoFactorAuth.update({
        where: {
          id: user2FA.id,
        },
        data: {
          isEnabled: true,
          isVerified: true,
          backupCodes: backupCodes.reduce((map, code) => {
            map[code] = false;
            return map;
          }, {}),
        },
      });
      reply.code(200).send({
        backupCodes,
      });
      return;
    }

    return sendError(reply, 400, `Invalid ${method} code!`);
  });
  // TODO: validate body
  fastify.post("/challenge", async (request, reply) => {
    const { code, sessionToken, method } = request.body;
    let payload;
    try {
      payload = fastify.jwt.verify(sessionToken);
    } catch (err) {
      return sendError(reply, 401, "Invalid or expired session token");
    }
    if (payload.stat !== "awaiting_2fa")
      return sendError(reply, 401, "Session not awaiting 2FA");

    const user2FA = await _2FAService.fetchUser2FA(payload.userId, method);
    if (!user2FA)
      return sendError(reply, 400, `You must setup ${method} first`);

    const secret = _2FAService.decrypt2FASecret(
      user2FA.secret,
      user2FA.iv,
      user2FA.tag
    );
    if (await _2FAService.verify2FAToken(secret, code)) {
      const { accessToken, refreshToken } = await authService.newUserSession(
        fastify,
        request,
        payload.userId
      );
      reply.setCookie("token", accessToken, {
        path: "/",
        secure: environ.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600,
        signed: true,
        httpOnly: true,
      });
      return { accessToken, refreshToken };
    }
    return sendError(reply, 401, "Invalid 2FA code!");
  });
  done();
};
