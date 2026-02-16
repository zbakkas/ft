import dotenv from "dotenv";

dotenv.config({ path: [".env", "../.env.shared"] });

export const environ = {
  PORT: process.env.PORT || 3002,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  INTERNAL_HMAC_SECRET: process.env.INTERNAL_HMAC_SECRET,
  GAME_SERVICE_URL: process.env.GAME_SERVICE_URL,
  LOG_DIR: process.env.LOG_DIR || "../logs",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://rabbit",
};
