import { config } from "dotenv";

config({
  path: ["./env", "../.env.shared"],
});

await Promise.all(
  ["infrastructure"].map(async (p) => {
    const r = await fetch(`${process.env.VAULT_ADDR}/v1/secret/data/${p}`);
    const d = await r.json();

    Object.entries(d.data.data).forEach(([k, v]) => {
      if (!process.env[k]) {
        process.env[k] = v;
      }
    });
  }),
);

export default {
  PORT: process.env.PORT || 3004,
  INTERNAL_HMAC_SECRET: process.env.INTERNAL_HMAC_SECRET,
  LOG_DIR: process.env.LOG_DIR || "../logs",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  USER_MGMT_SERVICE_URL: process.env.USER_MGMT_SERVICE_URL,
};
