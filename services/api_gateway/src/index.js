import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import { randomUUID } from "crypto";
import { sendError } from "./utils/fastify.js";
import { environ } from "./utils/environ.js";
import { pathToRegexp } from "path-to-regexp";
import fastifyCors from "@fastify/cors";
import fastifyMetrics from "fastify-metrics";
import fastifyCookie from "@fastify/cookie";
import helmet from "@fastify/helmet";

const fastify = Fastify({
  genReqId: () => randomUUID(),
  requestIdHeader: "x-request-id",
  logger: {
    transport: {
      targets: [
        { target: "pino-pretty", level: "info" },
        {
          target: "pino/file",
          options: { destination: `${environ.LOG_DIR}/api_gateway.log` },
          level: "info",
        },
      ],
    },
  },
});

await fastify.register(fastifyMetrics, {
  endpoint: "/metrics",
  defaultMetrics: true,
  routeMetrics: true,
});

fastify.register(fastifyCookie);
fastify.register(helmet, {
  crossOriginResourcePolicy: false,
});

await fastify.register(fastifyCors, {
  origin: environ.CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "OPTIONS", "PATCH", "DELETE"],
});

const publicRoutes = [
  "/metrics",
  "/api/v1/auth/metrics",
  "/api/v1/auth/login",
  "/api/v1/auth/forget-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/resend-verification",
  "/api/v1/auth/register",
  "/api/v1/auth/verify",
  "/api/v1/auth/otp/verify",
  "/api/v1/auth/refresh",
  "/api/v1/auth/oauth/:provider/callback",
  "/api/v1/auth/oauth/:provider",
  "/api/v1/auth/2fa/challenge",
  "/health",
].map((path) => pathToRegexp(path));

fastify.addHook("onRequest", async (request, reply) => {
  request.headers["x-request-id"] = request.id;
  reply.header("x-request-id", request.id);
});

fastify.addHook("onRequest", async (request, reply) => {
  const isInternal = request.url.includes("/internal/");

  if (isInternal) {
    return reply.code(403).send({ error: "Forbidden" });
  }
  const url = request.url.split("?")[0];
  if (publicRoutes.some((regex) => regex.regexp.test(url))) return;
  let headers = request.headers;
  if (request.url.startsWith("/ws/")) {
    headers = {
      cookie: headers.cookie,
    };
  }
  const result = await fetch(`${environ.AUTH_SERVICE_URL}/api/v1/verify`, {
    method: "GET",
    headers,
  });
  if (!result.ok) return sendError(reply, 401, "Unauthorized");
  const response = await result.json();
  if (request.url.startsWith("/ws/")) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    url.searchParams.set("userId", response.userId);
    request.raw.url = url.pathname + url.search;
  } else {
    request.headers["x-user-id"] = response.userId;
  }
});

fastify.register(proxy, {
  upstream: environ.AUTH_SERVICE_URL,
  prefix: "/api/v1/auth",
  rewritePrefix: "/api/v1",
});

fastify.register(proxy, {
  upstream: environ.USER_MGMT_SERVICE_URL,
  prefix: "/api/v1/user-mgmt",
  rewritePrefix: "/",
});

fastify.register(proxy, {
  upstream: environ.CHAT_SERVICE_URL,
  prefix: "/api/v1/chat",
  rewritePrefix: "/",
});

fastify.register(proxy, {
  wsUpstream: environ.CHAT_SERVICE_WS_URL,
  prefix: "/ws/chat",
  rewritePrefix: "/",
  websocket: true,
});

fastify.register(proxy, {
  upstream: environ.NOTIFICATION_SERVICE_URL,
  prefix: "/api/v1/notification",
  rewritePrefix: "/",
});

fastify.register(proxy, {
  upstream: environ.TOURNAMENT_SERVICE_URL,
  prefix: "/api/v1/tournament",
  rewritePrefix: "/",
});

fastify.register(proxy, {
  wsUpstream: environ.NOTIFICATION_SERVICE_WS_URL,
  prefix: "/ws/notification",
  rewritePrefix: "/",
  websocket: true,
});

// 
fastify.register(proxy, {
  wsUpstream: environ.GAME_SERVICE_WS_URL,
  prefix: "/ws/game",
  rewritePrefix: "/",
  websocket: true,
});

fastify.register(proxy, {
  wsUpstream: environ.GAME_SERVICE_WS_URL,
  prefix: "/ws/private",
  rewritePrefix: "/",
  websocket: true,
});


fastify.register(proxy, {
  wsUpstream: environ.SKYJO_SERVICE_WS_URL,
  prefix: "/ws/skyjo",
  rewritePrefix: "/",
  websocket: true,
});

fastify.register(proxy, {
  upstream: environ.SKYJO_SERVICE_URL,
  prefix: "/api/v1/skyjo",
  rewritePrefix: "/api",
});

fastify.register(proxy, {
  upstream: environ.GAME_SERVICE_URL,
  prefix: "/api/v1/game",
  rewritePrefix: "/api",
});

fastify.register(proxy, {
  upstream: environ.GAME_SERVICE_URL,
  prefix: "/api/tournament",
  rewritePrefix: "/api/tournament",
});
// 

fastify.get("/health", (request, reply) => {
  return { message: "healthy" };
});

fastify.listen({ port: environ.PORT, host: "0.0.0.0" });
