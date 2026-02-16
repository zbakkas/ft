import Fastify from "fastify";
import indexRoute from "./routes/index.routes.js";
import fastifyMultipart from "@fastify/multipart";
import { environ } from "./utils/environ.js";
import hmacVerify from "./utils/hmac.js";
import { randomUUID } from "crypto";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import rabbitmq from "./plugins/rabbitmq.js";

const fastify = Fastify({
  genReqId: () => randomUUID(),
  requestIdHeader: "x-request-id",
  logger: {
    transport: {
      targets: [
        { target: "pino-pretty", level: "info" },
        {
          target: "pino/file",
          options: { destination: `${environ.LOG_DIR}/user-mgmt.log` },
          level: "info",
        },
      ],
    },
  },
  ajv: {
    customOptions: {
      removeAdditional: false,
      useDefaults: false,
      coerceTypes: false,
      validateSchema: false,
      validateFormats: false,
      allErrors: false,
    },
    plugins: [],
  },
});

// await fastify.register(swagger, {
//   openapi: {
//     info: {
//       title: "My API",
//       version: "1.0.0",
//       description: "Example Fastify API with auto-generated docs",
//     },
//     components: {
//       securitySchemes: {
//         bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
//       },
//     },
//     servers: [{ url: `${environ.CLIENT_URL}/api/v1/user-mgmt` }],
//   },
// });
// await fastify.register(swaggerUI, {
//   routePrefix: "/docs",
//   uiConfig: { docExpansion: "list" },
// });

fastify.register(fastifyMultipart);
fastify.register(rabbitmq);
fastify.register(hmacVerify, { secret: environ.INTERNAL_HMAC_SECRET });

fastify.register(indexRoute, { prefix: "/" });

fastify.addHook("onRequest", async (request, reply) => {
  // * trace request
  request.headers["x-request-id"] = request.id;
  reply.header("x-request-id", request.id);
  if (request.headers["x-user-id"]) {
    request.log = request.log.child({ userId: request.headers["x-user-id"] });
  }
});

fastify.setErrorHandler((error, req, reply) => {
  const status = error.statusCode || 500;

  if (status >= 500) {
    reply.status(status).send({
      statusCode: status,
      error: "Internal Server Error",
      message: "Unexpected error",
    });
  } else {
    let details;
    try {
      details = JSON.parse(error.message);
    } catch (e) {
      details = error.message;
    }
    reply.status(status).send({
      statusCode: status,
      error: reply.raw.statusMessage,
      message: details,
    });
  }
  req.log.error(error.message);
});

try {
  await fastify.listen({ port: environ.PORT, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
