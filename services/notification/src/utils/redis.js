import IORedis from "ioredis";
import environ from "./environ";

export const redis = new IORedis({
  host: environ.REDIS_HOST,
  password: environ.REDIS_PASSWORD,
  port: parseInt(environ.REDIS_PORT, 10),
  maxRetriesPerRequest: null,
});
