import type { Channel, ChannelModel } from "amqplib";

declare module "fastify" {
  interface FastifyInstance {
    rabbit: {
      connection: ChannelModel;
      channel: Channel;
    };
  }
}
