import dotenv from "dotenv";

dotenv.config({ path: [".env", "../.env.shared"] });

export const environ = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET,
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  TWO_FA_KEY: Buffer.from(process.env.TWO_FA_KEY, "hex"),
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,
  INTERNAL_HMAC_SECRET: process.env.INTERNAL_HMAC_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  MAIL_SENDER: process.env.MAIL_SENDER,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
  NODE_ENV: process.env.NODE_ENV || "production",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  USER_MGMT_SERVICE_URL: process.env.USER_MGMT_SERVICE_URL,
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || "http://localhost:3000",
  DOMAIN: process.env.DOMAIN || "http://localhost",
  LOG_DIR: process.env.LOG_DIR || "../logs",
};
