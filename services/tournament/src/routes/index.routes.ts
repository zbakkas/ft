import type { FastifyPluginCallback } from "fastify";
import tournamentRoutes from "./tournament.routes";

export default ((fastify, opts) => {
  fastify.register(tournamentRoutes);
}) as FastifyPluginCallback;
