import Fastify from "fastify";
import indexRoutes from "./routes/index.routes.js";
import consumer from "./consumer.js";
import { cacheBlocks, cacheFriendships } from "./utils/cache.js";
import websocket from "@fastify/websocket";
import { randomUUID } from "crypto";
import environ from "./utils/environ.js";

const fastify = Fastify({
  genReqId: () => randomUUID(),
  requestIdHeader: "x-request-id",
  logger: {
    transport: {
      targets: [
        { target: "pino-pretty", level: "info" },
        {
          target: "pino/file",
          options: { destination: `${environ.LOG_DIR}/notification.log` },
          level: "info",
        },
      ],
    },
  },
});

fastify.register(websocket);
fastify.register(indexRoutes);
fastify.addHook("onReady", () => {
  cacheFriendships().catch((error) => {
    console.log(`Failed to warmup friendship cache: ${error}`);
  });
  cacheBlocks().catch((error) => {
    console.log(`Failed to warmup block cache: ${error}`);
  });
  consumer().catch((error) => {
    console.log(`Failed to start rabbitmq consumer: ${error}`);
  });
});

fastify.listen({ port: environ.PORT, host: "0.0.0.0" });
