import axios from "axios";
import { sendError, sendSuccess } from "../utils/fastify.js";
import { authService } from "../services/auth.services.js";
import { prisma } from "../db/prisma.js";
import { environ } from "../utils/environ.js";
import { getQueue, QueueType } from "../services/queue.services.js";

const providers = {
  google: {
    clientId: environ.GOOGLE_CLIENT_ID,
    clientSecret: environ.GOOGLE_CLIENT_SECRET,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scopes: ["openid", "email", "profile"],
  },
  github: {
    clientId: environ.GITHUB_CLIENT_ID,
    clientSecret: environ.GITHUB_CLIENT_SECRET,
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    scopes: ["user:email"],
  },
};

/**
 * @type {import('fastify').FastifyPluginCallback}
 */
export default (fastify, opts, done) => {
  fastify.get("/:provider", (request, reply) => {
    const { provider } = request.params;
    const config = providers[provider];
    if (provider === "github")
      return sendSuccess(reply, 200, "Github OAuth", {
        link: `${config.authUrl}?scope=${config.scopes.join(",")}&client_id=${
          config.clientId
        }`,
      });
    return sendError(reply, 400, "Unsupported OAuth provider");
  });
  const getOAuthProfile = async (provider, code, redirect_uri) => {
    const config = providers[provider];
    try {
      if (provider === "github") {
        const { data: accessTokenData } = await axios.post(
          config.tokenUrl,
          {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri,
          },
          {
            headers: { Accept: "application/json" },
          }
        );
        const [{ data: profile }, { data: emails }] = await Promise.all([
          axios.get(config.profileUrl, {
            headers: {
              Authorization: `Bearer ${accessTokenData.access_token}`,
            },
          }),
          axios.get("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${accessTokenData.access_token}`,
            },
          }),
        ]);

        const primaryEmail =
          emails.find((email) => email.primary)?.email || emails[0]?.email;

        return {
          success: true,
          oAuthProfile: {
            id: profile.id.toString(),
            email: primaryEmail,
            name: profile.name || profile.login,
          },
        };
      }
    } catch (e) {
      console.log(e);
      return { success: false, reason: "Something went wrong" };
    }
    return { success: false, reason: "Unsupported OAuth provider" };
  };
  fastify.get("/:provider/callback", async (request, reply) => {
    const { provider } = request.params;
    const { code } = request.query;
    const config = providers[provider];
    const { success, reason, oAuthProfile } = await getOAuthProfile(
      provider,
      code,
      `${environ.API_GATEWAY_URL}/api/v1/auth/oauth/${provider}/callback`
    );
    if (!success) return sendError(reply, 400, reason);
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: oAuthProfile.email.toLowerCase().trim(),
          },
          {
            OAuthLink: {
              some: {
                provider,
                providerId: oAuthProfile.id,
              },
            },
          },
        ],
      },
      include: {
        OAuthLink: true,
      },
    });
    if (
      userExists &&
      userExists.OAuthLink.some(
        (link) =>
          link.providerId === oAuthProfile.id && link.provider === provider
      )
    ) {
      const { accessToken, refreshToken } = await authService.newUserSession(
        fastify,
        request,
        userExists.id
      );
      return sendSuccess(reply, 200, "User already exists!", {
        accessToken,
        refreshToken,
      });
    } else if (userExists) {
      return sendError(
        reply,
        400,
        `Account with ${oAuthProfile.email} already exists! log in to it and link your account to it`
      );
    }
    const created_user = await prisma.user.create({
      data: {
        email: oAuthProfile.email,
        isVerified: true,
        OAuthLink: {
          create: {
            provider: provider,
            providerId: oAuthProfile.id,
          },
        },
      },
    });
    await getQueue(QueueType.EMAIL).add("welcome-email", {
      email: oAuthProfile.email,
      template: "welcome",
      context: {
        username: oAuthProfile.name,
      },
    });
    const { accessToken, refreshToken } = await authService.newUserSession(
      fastify,
      request,
      created_user.id
    );
    return sendSuccess(reply, 201, "User successfully created!", {
      accessToken,
      refreshToken,
    });
  });
  fastify.post("/link", async (request, reply) => {
    // const { provider, code, }
  });
  done();
};
