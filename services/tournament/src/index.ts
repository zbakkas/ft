import { randomUUID } from "crypto";
import Fastify from "fastify";
import consumer from "./plugins/consumer";
import indexRoutes from "./routes/index.routes";
import { environ } from "./utils/environ";

const fastify = Fastify({
  genReqId: () => randomUUID(),
  requestIdHeader: "x-request-id",
  logger: {
    transport: {
      targets: [
        { target: "pino-pretty", level: "info" },
        {
          target: "pino/file",
          options: { destination: "../logs/tournament.log" },
          level: "info",
        },
      ],
    },
  },
});

fastify.register(consumer, { url: environ.RABBITMQ_URL });

fastify.register(indexRoutes, { prefix: "/" });

fastify.listen({ port: 3006, host: "0.0.0.0" }, (err) => {
  if (err) console.error;
});
