import { config } from "dotenv";

config({
  path: ["./env", "../.env.shared"],
});

export default {
  PORT: process.env.PORT || 3004,
  INTERNAL_HMAC_SECRET: process.env.INTERNAL_HMAC_SECRET,
  LOG_DIR: process.env.LOG_DIR || "../logs",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  USER_MGMT_SERVICE_URL: process.env.USER_MGMT_SERVICE_URL,
};
