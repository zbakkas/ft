import {FastifyInstance} from "fastify"

declare module "fastify" {
  interface FastifyInstance {
    rabbit: {
      connection: any;
      channel: any;
    };
  }
}