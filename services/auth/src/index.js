import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import { randomUUID } from "crypto";
import Fastify from "fastify";
import fastifyMetrics from "fastify-metrics";
import { redis } from "./db/redis.js";
import rabbitmq from "./plugins/rabbitmq.js";
import workers from "./plugins/workers.js";
import indexRoute from "./routes/index.routes.js";
import { closeAll, getQueue, QueueType } from "./services/queue.services.js";
import { environ } from "./utils/environ.js";

const fastify = Fastify({
  genReqId: () => randomUUID(),
  requestIdHeader: "x-request-id",
  logger: {
    transport: {
      targets: [
        { target: "pino-pretty", level: "info" },
        {
          target: "pino/file",
          options: { destination: `${environ.LOG_DIR}/auth.log` },
          level: "info",
        },
      ],
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        host: req.host,
        remoteAddress: req.ip,
        remotePort: req.port,
        userId: req.headers["x-user-id"] || undefined,
      }),
    },
  },
});

await fastify.register(fastifyMetrics, {
  endpoint: "/api/v1/metrics",
  defaultMetrics: true,
  routeMetrics: true,
});

fastify.register(rabbitmq);
fastify.register(workers);

await fastify.register(fastifyCookie, {
  secret: environ.COOKIE_SECRET,
});

fastify.register(fastifyJwt, {
  secret: environ.JWT_SECRET,
  cookie: {
    cookieName: "token",
    signed: true,
  },
});

await fastify.register(fastifyRateLimit, {
  global: false,
  max: 3,
  timeWindow: "1 minute",
  redis,
});

await fastify.register(indexRoute, { prefix: "/api/v1" });

fastify.addHook("onReady", async () => {
  getQueue(QueueType.REGISTRATION);
  getQueue(QueueType.EMAIL);
});

fastify.addHook("onClose", async () => {
  await closeAll();
});

fastify.addHook("onRequest", async (request, reply) => {
  request.headers["x-request-id"] = request.id;
  reply.header("x-request-id", request.id);
  if (request.headers["x-user-id"]) {
    request.log = request.log.child({ userId: request.headers["x-user-id"] });
  }
});

try {
  await fastify.listen({ port: environ.PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
