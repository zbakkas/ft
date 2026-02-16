import healthRoutes from "./health.routes.js";
import notificationRoutes from "./notification.routes.js";

/**
 * @type {import('fastify').FastifyPluginAsync}
 */
export default (fastify) => {
  fastify.register(healthRoutes, { prefix: "/health" });
  fastify.register(notificationRoutes, { prefix: "/" });
};
