import dotenv from "dotenv";

dotenv.config({ path: [".env", "../.env.shared"] });

export const environ = {
  PORT: process.env.PORT || 3003,
  INTERNAL_HMAC_SECRET: process.env.INTERNAL_HMAC_SECRET,
  USER_MGMT_SERVICE_URL: process.env.USER_MGMT_SERVICE_URL,
  LOG_DIR: process.env.LOG_DIR || "../logs",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
};
